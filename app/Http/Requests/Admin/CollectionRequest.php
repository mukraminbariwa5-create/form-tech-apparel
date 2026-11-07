<?php

namespace App\Http\Requests\Admin;

use App\Rules\ImageLocation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CollectionRequest extends FormRequest
{
    public function authorize(): bool { return (bool) $this->user()?->is_admin; }
    protected function getRedirectUrl(): string
    {
        return $this->route('collection') ? '/admin/collections/'.$this->route('collection')->id.'/edit' : '/admin/collections/create';
    }
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:120'], 'slug' => ['required', 'string', 'max:160', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/D', Rule::unique('collections')->ignore($this->route('collection'))],
            'description' => ['required', 'string', 'max:2000'], 'active' => ['required', 'boolean'],
            'image_url' => ['nullable', 'string', 'max:2048', new ImageLocation], 'revision' => ['nullable', 'string', 'size:64'],
            'product_ids' => ['present', 'array', 'max:1000'], 'product_ids.*' => ['integer', 'distinct', Rule::exists('products', 'id')],
        ];
    }
}
