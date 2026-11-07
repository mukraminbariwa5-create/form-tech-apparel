<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StaffAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_to_staff_login(): void
    {
        $this->get('/admin')->assertRedirect('/login');
    }

    public function test_non_admin_cannot_access_admin_or_sign_in(): void
    {
        $user = User::create(['name' => 'Non staff', 'email' => 'visitor@example.test', 'password' => 'a-test-password-123']);
        $this->actingAs($user)->get('/admin')->assertForbidden();
        auth()->logout();
        $this->post('/login', ['email' => $user->email, 'password' => 'a-test-password-123'])->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    public function test_staff_can_sign_in_and_logout(): void
    {
        $user = User::create(['name' => 'Staff', 'email' => 'staff@example.test', 'password' => 'a-test-password-123', 'is_admin' => true]);
        $this->post('/login', ['email' => $user->email, 'password' => 'a-test-password-123'])->assertRedirect('/admin');
        $this->assertAuthenticatedAs($user);
        $this->withoutVite()->get('/admin')->assertOk();
        $this->post('/logout')->assertRedirect('/');
        $this->assertGuest();
    }

    public function test_unneeded_account_routes_are_absent(): void
    {
        foreach (['/register', '/forgot-password', '/settings/profile', '/two-factor-challenge', '/user/confirm-password', '/user/confirmed-password-status'] as $path) {
            $this->get($path)->assertNotFound();
        }
        $this->post('/register', [])->assertNotFound();
    }
}
