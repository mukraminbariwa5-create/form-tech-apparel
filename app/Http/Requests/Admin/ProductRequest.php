<?php

namespace App\Http\Requests\Admin;

use App\Rules\ImageLocation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class ProductRequest extends FormRequest
{
    public function authorize(): bool { return (bool) $this->user()?->is_admin; }

    protected function getRedirectUrl(): string
    {
        return $this->route('product') ? '/admin/products/'.$this->route('product')->id.'/edit' : '/admin/products/create';
    }

    public function rules(): array
    {
        $product = $this->route('product');
        $owned = $product?->variants()->pluck('id')->all() ?? [];
        $rules = [
            'title' => ['required', 'string', 'max:120'], 'slug' => ['required', 'string', 'max:160', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/D', Rule::unique('products')->ignore($product)],
            'description' => ['required', 'string', 'max:5000'], 'active' => ['required', 'boolean'], 'revision' => ['nullable', 'string', 'size:64'],
            'size_guide' => ['required', 'array:label,measurements'], 'size_guide.label' => ['required', 'string', 'max:160'],
            'size_guide.measurements' => ['required', 'array', 'min:1', 'max:30'], 'size_guide.measurements.*' => ['required', 'string', 'max:160'],
            'collection_ids' => ['present', 'array', 'max:50'], 'collection_ids.*' => ['integer', 'distinct', Rule::exists('collections', 'id')],
            'images' => ['required', 'array', 'min:1', 'max:8'], 'images.*' => ['array:url,alt,color'],
            'images.*.color' => ['nullable', 'string', 'max:64', Rule::in(collect($this->input('variants', []))->filter(fn ($v) => is_array($v))->pluck('color')->all())],
            'images.*.url' => ['required', 'string', 'max:2048', new ImageLocation], 'images.*.alt' => ['required', 'string', 'max:255'],
            'variants' => ['required', 'array', 'min:1', 'max:100'], 'variants.*' => ['array:id,sku,size,color,price_cents,stock,active,updated_at'],
            'variants.*.id' => ['nullable', 'integer', 'distinct', Rule::in($owned)], 'variants.*.sku' => ['required', 'string', 'max:100', 'distinct'],
            'variants.*.size' => ['required', 'string', 'max:32'], 'variants.*.color' => ['required', 'string', 'max:64'],
            'variants.*.price_cents' => ['required', 'integer', 'min:0', 'max:2147483647'], 'variants.*.stock' => ['required', 'integer', 'min:0', 'max:1000000'],
            'variants.*.active' => ['required', 'boolean'], 'variants.*.updated_at' => ['nullable', 'string'],
        ];
        foreach ((array) $this->input('variants', []) as $index => $variant) {
            if (! is_array($variant)) { continue; }
            $id = in_array($variant['id'] ?? null, $owned, true) ? $variant['id'] : null;
            $rules['variants.'.$index.'.sku'] = [...$rules['variants.*.sku'], Rule::unique('variants', 'sku')->ignore($id)];
        }
        return $rules;
    }

    public function after(): array
    {
        return [function (Validator $validator) {
            $variants = collect($this->input('variants', []))->filter(fn ($v) => is_array($v));
            $pairs = $variants->map(fn ($v) => [$v['size'] ?? '', $v['color'] ?? '']);
            if ($pairs->uniqueStrict()->count() !== $pairs->count()) { $validator->errors()->add('variants', 'Each size/color combination must be unique.'); }
            $owned = $this->route('product')?->variants()->pluck('id')->all() ?? [];
            if (array_diff($owned, $variants->pluck('id')->all())) { $validator->errors()->add('variants', 'Keep existing variants and deactivate them instead of removing them.'); }
            foreach (array_keys((array) $this->input('size_guide.measurements', [])) as $size) {
                if (strlen((string) $size) > 32 || trim((string) $size) === '') { $validator->errors()->add('size_guide.measurements', 'Size labels must contain 1–32 characters.'); }
            }
        }];
    }
}
