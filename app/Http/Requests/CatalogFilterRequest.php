<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class CatalogFilterRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'q' => ['nullable', 'string', 'max:100'],
            'collection' => ['nullable', 'string', 'max:100', Rule::exists('collections', 'slug')->where('active', true)],
            'size' => ['nullable', 'string', 'max:32'],
            'color' => ['nullable', 'string', 'max:64'],
            'availability' => ['nullable', Rule::in(['in-stock', 'out-of-stock'])],
            'min_price' => ['nullable', 'integer', 'min:0', 'max:10000000'],
            'max_price' => ['nullable', 'integer', 'min:0', 'max:10000000', ...($this->filled('min_price') ? ['gte:min_price'] : [])],
            'sort' => ['nullable', Rule::in(['curated', 'newest', 'price-asc', 'price-desc', 'name'])],
            'page' => ['nullable', 'integer', 'min:1', 'max:10000'],
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(Inertia::render('storefront/error', [
            'status' => 422, 'message' => 'Some shop filters are invalid. Clear them and try again.',
            'details' => $validator->errors()->all(),
        ])->toResponse($this)->setStatusCode(422));
    }
}
