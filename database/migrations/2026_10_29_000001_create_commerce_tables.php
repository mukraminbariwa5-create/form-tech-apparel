<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('title');
            $table->text('description');
            $table->jsonb('size_guide');
            $table->boolean('active')->default(true)->index();
            $table->boolean('featured')->default(false)->index();
            $table->timestamps();
            $table->index('created_at');
        });
        Schema::create('product_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->text('url');
            $table->string('alt');
            $table->integer('position')->default(0);
            $table->unique(['product_id', 'position']);
        });
        Schema::create('variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->string('sku')->unique();
            $table->string('size', 32);
            $table->string('color', 64);
            $table->integer('price_cents');
            $table->integer('stock')->default(0);
            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->unique(['product_id', 'size', 'color']);
            $table->index(['product_id', 'active', 'price_cents']);
        });
        DB::statement('ALTER TABLE variants ADD CONSTRAINT variants_nonnegative CHECK (price_cents >= 0 AND stock >= 0)');
        Schema::create('collections', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('title');
            $table->text('description');
            $table->text('image_url')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });
        Schema::create('collection_product', function (Blueprint $table) {
            $table->foreignId('collection_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->primary(['collection_id', 'product_id']);
            $table->index('product_id');
        });
        Schema::create('site_contents', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->jsonb('value');
            $table->timestamps();
        });
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->uuid('public_reference')->unique();
            $table->uuid('checkout_idempotency_key')->unique();
            $table->string('customer_name');
            $table->string('customer_email');
            $table->jsonb('address');
            $table->text('notes')->nullable();
            $table->integer('subtotal_cents');
            $table->integer('shipping_cents')->default(0);
            $table->integer('tax_cents')->default(0);
            $table->integer('total_cents');
            $table->string('currency', 3)->default('USD');
            $table->string('status', 16)->default('new')->index();
            $table->boolean('demo')->default(true);
            $table->timestamps();
            $table->index('created_at');
            $table->index('customer_email');
        });
        DB::statement("ALTER TABLE orders ADD CONSTRAINT orders_valid_status CHECK (status IN ('new', 'reviewed', 'cancelled'))");
        DB::statement('ALTER TABLE orders ADD CONSTRAINT orders_valid_totals CHECK (subtotal_cents >= 0 AND shipping_cents >= 0 AND tax_cents >= 0 AND total_cents = subtotal_cents + shipping_cents + tax_cents AND demo = true)');
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->restrictOnDelete();
            $table->foreignId('variant_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->string('sku');
            $table->string('size', 32);
            $table->string('color', 64);
            $table->integer('price_cents');
            $table->integer('quantity');
        });
        DB::statement('ALTER TABLE order_items ADD CONSTRAINT order_items_valid_amounts CHECK (price_cents >= 0 AND quantity > 0)');
        Schema::create('contact_messages', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email');
            $table->text('message');
            $table->timestamps();
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        foreach (['contact_messages', 'order_items', 'orders', 'site_contents', 'collection_product', 'collections', 'variants', 'product_images', 'products'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
