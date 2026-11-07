<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CheckoutRequest extends FormRequest
{
    protected $redirect = '/checkout';
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'key' => ['required', 'uuid'],
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:254'],
            'address' => ['required', 'array:line1,city,province,postal_code,country'],
            'address.line1' => ['required', 'string', 'max:200'],
            'address.city' => ['required', 'string', 'max:100'],
            'address.province' => ['required', 'string', 'max:100'],
            'address.postal_code' => ['required', 'string', 'max:24'],
            'address.country' => ['required', 'string', 'max:80'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
