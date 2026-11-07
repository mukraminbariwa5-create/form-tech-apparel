<?php

namespace Tests\Feature;

use App\Models\Collection;
use App\Models\ContactMessage;
use App\Models\Order;
use App\Models\Product;
use App\Models\SiteContent;
use App\Models\User;
use App\Services\PlaceDemoOrder;
use App\Services\RecordRevision;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class AdminManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['inertia.ssr.enabled' => false]);
        $this->withoutVite();
        $this->seed();
    }

    private function staff(): User
    {
        return User::create(['name' => 'Demo Staff', 'email' => 'admin@example.test', 'password' => 'test-only-password-123', 'is_admin' => true]);
    }

    private function productData(Product $product): array
    {
        return [...$product->only(['title', 'slug', 'description', 'active', 'size_guide']), 'revision' => RecordRevision::of($product),
            'collection_ids' => $product->collections()->pluck('collections.id')->all(),
            'images' => $product->images->map->only(['url', 'alt'])->all(),
            'variants' => $product->variants->map->only(['id', 'sku', 'size', 'color', 'price_cents', 'stock', 'active'])->all()];
    }

    public function test_image_color_bindings_are_validated_and_survive_legacy_edits(): void
    {
        $this->actingAs($this->staff());
        $product = Product::where('slug', 'aeroshell-jacket')->firstOrFail()->load(['images', 'variants']);
        $data = $this->productData($product);
        $data['images'][0]['color'] = 'No such variant color';
        $this->put('/admin/products/'.$product->id, $data)->assertSessionHasErrors('images.0.color');
        unset($data['images'][0]['color']);
        $this->put('/admin/products/'.$product->id, $data)->assertSessionHasNoErrors();
        $this->assertSame(['Silver', 'Charcoal'], $product->images()->pluck('color')->all());
    }

    public function test_every_staff_read_and_mutation_is_protected(): void
    {
        $reads = ['/admin', '/admin/products', '/admin/products/create', '/admin/products/1/edit', '/admin/collections', '/admin/collections/create', '/admin/collections/1/edit', '/admin/orders', '/admin/orders/1', '/admin/content', '/admin/contacts'];
        $writes = [['POST','/admin/products'],['PUT','/admin/products/1'],['POST','/admin/collections'],['PUT','/admin/collections/1'],['PATCH','/admin/orders/1'],['PUT','/admin/content']];
        foreach ($reads as $path) { $this->get($path)->assertRedirect('/login'); }
        foreach ($writes as [$method,$path]) { $this->call($method, $path)->assertRedirect('/login'); }
        $this->actingAs(User::create(['name'=>'Visitor','email'=>'guest@example.test','password'=>'test-password']));
        foreach ($reads as $path) { $this->get($path)->assertForbidden(); }
        foreach ($writes as [$method,$path]) { $this->call($method, $path)->assertForbidden(); }
    }

    public function test_product_edit_variants_archive_create_and_storefront_reflect_real_changes(): void
    {
        $this->actingAs($this->staff());
        $product = Product::where('slug','aeroshell-jacket')->firstOrFail();
        $data = $this->productData($product);
        $data['title'] = 'Edited AeroShell';
        $data['variants'][0]['price_cents'] = 34500;
        $this->get('/admin/products/'.$product->id.'/edit')->assertOk()->assertInertia(fn (Assert $page) => $page->where('product.title', 'AeroShell Jacket'));
        $this->put('/admin/products/'.$product->id, $data)->assertSessionHasNoErrors()->assertRedirect();
        $this->get('/products/aeroshell-jacket')->assertInertia(fn (Assert $page) => $page->where('product.title', 'Edited AeroShell')->where('product.variants.0.price_cents',34500));
        $this->assertDatabaseHas('products',['id'=>$product->id,'title'=>'Edited AeroShell']);
        $data = $this->productData($product->fresh());
        $data['active'] = false;
        $this->put('/admin/products/'.$product->id,$data)->assertSessionHasNoErrors();
        $this->get('/products/aeroshell-jacket')->assertNotFound();
        $this->assertDatabaseCount('products',30);
        $this->get('/admin/products/create')->assertOk()->assertInertia(fn (Assert $page) => $page->where('product',null));
        $data['title']='New Demo Layer'; $data['slug']='new-demo-layer'; $data['active']=true; $data['revision']=null;
        $data['variants']=[['sku'=>'FT-NEW','size'=>'M','color'=>'Silver','price_cents'=>12000,'stock'=>3,'active'=>true]];
        $this->post('/admin/products',$data)->assertSessionHasNoErrors()->assertRedirect();
        $this->get('/products/new-demo-layer')->assertOk();
        $this->get('/admin/products?q=New%20Demo')->assertInertia(fn (Assert $page) => $page->has('products.data',1));
    }

    public function test_stale_editor_cannot_restore_stock_changed_after_opening_even_same_second(): void
    {
        $this->actingAs($this->staff());
        $product = Product::firstOrFail();
        $data = $this->productData($product);
        $variant = $product->variants->first();
        $variant->decrement('stock');
        $this->put('/admin/products/'.$product->id,$data)->assertSessionHasErrors('conflict');
        $this->assertSame($data['variants'][0]['stock']-1,$variant->fresh()->stock);
    }

    public static function unsafeImages(): array
    {
        return array_map(fn ($url) => [$url], ['javascript:alert(1)','data:image/png;base64,test','http://example.com/image.png','https://user:pass@example.com/image.png','https://localhost/image.png','https://127.0.0.1/image.png','https://[::1]/x','/images/../app.php','/images/nonexistent.png','//example.com/x.png','https://example.local/x.png']);
    }

    #[DataProvider('unsafeImages')]
    public function test_unsafe_image_destinations_are_rejected(string $url): void
    {
        $this->actingAs($this->staff());
        $product = Product::firstOrFail();
        $data = $this->productData($product);
        $data['images'][0]['url']=$url;
        $this->put('/admin/products/'.$product->id,$data)->assertSessionHasErrors('images.0.url');
    }

    public function test_duplicate_slug_sku_pairs_foreign_variants_and_negative_stock_are_rejected(): void
    {
        $this->actingAs($this->staff());
        $product = Product::firstOrFail();
        $other = Product::where('id','!=',$product->id)->firstOrFail();
        $data=$this->productData($product);
        $data['slug']=$other->slug; $data['variants'][0]['sku']=$other->variants()->first()->sku; $data['variants'][0]['stock']=-1;
        $data['variants'][1]['size']=$data['variants'][0]['size']; $data['variants'][1]['color']=$data['variants'][0]['color'];
        $this->put('/admin/products/'.$product->id,$data)->assertSessionHasErrors(['slug','variants.0.sku','variants.0.stock','variants']);
        $data=$this->productData($product); $data['variants'][0]['id']=$other->variants()->first()->id;
        $this->put('/admin/products/'.$product->id,$data)->assertSessionHasErrors(['variants.0.id','variants']);
    }

    public function test_collections_assign_products_and_archive_without_breaking_fixed_navigation(): void
    {
        $this->actingAs($this->staff());
        $this->get('/admin/collections/create')->assertOk();
        $product=Product::firstOrFail();
        $data=['title'=>'Test Edit Collection','slug'=>'test-edit-collection','description'=>'Demo grouping','active'=>true,'image_url'=>'/images/collections/tech-pants.png','product_ids'=>[$product->id]];
        $this->post('/admin/collections',$data)->assertSessionHasNoErrors();
        $collection=Collection::where('slug',$data['slug'])->firstOrFail();
        $this->get('/collections/'.$collection->slug)->assertInertia(fn (Assert $page)=>$page->has('products',1));
        $data['active']=false; $data['revision']=RecordRevision::of($collection);
        $this->put('/admin/collections/'.$collection->id,$data)->assertSessionHasNoErrors();
        $this->get('/collections/'.$collection->slug)->assertNotFound();
        $core=Collection::where('slug','men')->firstOrFail();
        $data['slug']='renamed-men'; $data['revision']=RecordRevision::of($core);
        $this->put('/admin/collections/'.$core->id,$data)->assertSessionHasErrors('active');
    }

    public function test_home_content_updates_storefront_rejects_unsafe_links_and_stale_updates(): void
    {
        $this->actingAs($this->staff());
        $home=SiteContent::where('key','home')->firstOrFail();
        $data=[...$home->value,'revision'=>RecordRevision::of($home)];
        $data['hero']['headline']='NEW FICTIONAL PERSPECTIVE';
        $this->put('/admin/content',$data)->assertSessionHasNoErrors();
        $this->get('/')->assertInertia(fn (Assert $page)=>$page->where('content.hero.headline','NEW FICTIONAL PERSPECTIVE'));
        $this->put('/admin/content',$data)->assertSessionHasErrors('conflict');
        $data['hero']['primary_href']='//evil.example/path';
        $data['editorial']['cta_href']='javascript:alert(1)';
        $this->put('/admin/content',$data)->assertSessionHasErrors(['hero.primary_href','editorial.cta_href']);
    }

    public function test_staff_review_cancel_once_and_contact_visibility(): void
    {
        $this->actingAs($this->staff());
        $variant=Product::firstOrFail()->variants()->where('stock','>',0)->firstOrFail();
        $stock=$variant->stock;
        $order=app(PlaceDemoOrder::class)->place((string)Str::uuid(),[$variant->id=>1],[$variant->id=>['quantity'=>1,'price'=>$variant->price_cents]],['name'=>'Order Visitor','email'=>'order@example.test','address'=>['line1'=>'Fictional','city'=>'Demo','province'=>'Demo','postal_code'=>'00000','country'=>'Demo'],'notes'=>'Demo note']);
        $this->get('/admin/orders/'.$order->id)->assertInertia(fn (Assert $page)=>$page->where('order.customer_email','order@example.test')->where('order.address.line1','Fictional'));
        $this->get('/admin/orders?q=order%40example.test')->assertInertia(fn (Assert $page)=>$page->has('orders.data',1));
        $this->patch('/admin/orders/'.$order->id,['status'=>'reviewed'])->assertSessionHasNoErrors();
        $this->assertSame($stock-1,$variant->fresh()->stock);
        $this->patch('/admin/orders/'.$order->id,['status'=>'cancelled'])->assertSessionHasNoErrors()->assertRedirect('/admin/orders/'.$order->id);
        $this->patch('/admin/orders/'.$order->id,['status'=>'cancelled'])->assertSessionHasNoErrors();
        $this->assertSame($stock,$variant->fresh()->stock);
        $this->patch('/admin/orders/'.$order->id,['status'=>'new'])->assertSessionHasErrors('status');
        $this->assertSame('cancelled',$order->fresh()->status);
        $this->get('/admin')->assertInertia(fn (Assert $page)=>$page->where('metrics.orders',1)->where('metrics.order_value',0));
        ContactMessage::create(['name'=>'Demo Contact','email'=>'contact@example.test','message'=>'Saved demo message']);
        $this->get('/admin/contacts')->assertInertia(fn (Assert $page)=>$page->where('messages.data.0.message','Saved demo message'));
    }

    public function test_recovery_requires_existing_admin_and_invalidates_sessions(): void
    {
        $user=$this->staff(); $oldToken=$user->remember_token;
        config(['form-tech.admin_email'=>$user->email,'form-tech.admin_password'=>'new-test-only-password-456']);
        \Illuminate\Support\Facades\DB::table('sessions')->insert(['id'=>'test-session','user_id'=>$user->id,'payload'=>'','last_activity'=>time()]);
        $this->artisan('app:recover-admin')->assertSuccessful();
        $this->assertTrue(Hash::check('new-test-only-password-456',$user->fresh()->password));
        $this->assertNotSame($oldToken,$user->fresh()->remember_token);
        $this->assertDatabaseMissing('sessions',['id'=>'test-session']);
        config(['form-tech.admin_email'=>'missing@example.test']);
        $this->artisan('app:recover-admin')->assertFailed();
        $this->assertDatabaseCount('users',1);
    }
}
