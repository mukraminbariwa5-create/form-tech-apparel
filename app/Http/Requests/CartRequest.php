<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CartRequest extends FormRequest
{
    protected $redirect = '/cart';
    public function authorize(): bool { return true; }
    public function rules(): array
    {
        return ['variant_id' => ['required', 'integer', 'min:1'], 'quantity' => ['required', 'integer', 'min:1', 'max:1000000']];
    }
}
