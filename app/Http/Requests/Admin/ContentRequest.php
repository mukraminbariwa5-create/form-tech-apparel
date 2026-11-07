<?php

namespace App\Http\Requests\Admin;

use App\Models\Collection;
use App\Rules\ImageLocation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ContentRequest extends FormRequest
{
    protected $redirect = '/admin/content';
    public function authorize(): bool { return (bool) $this->user()?->is_admin; }
    public static function destinations(): array
    {
        return [...['/', '/#collections', '/shop', '/technology', '/about', '/size-guide'],
            ...Collection::where('active', true)->pluck('slug')->map(fn ($slug) => '/collections/'.$slug)->all()];
    }
    public function rules(): array
    {
        $rules = ['revision' => ['required', 'string', 'size:64'], 'announcement' => ['required', 'string', 'max:160'],
            'brand_statement' => ['required', 'string', 'max:350'],
            'featured_product_ids' => ['required', 'array', 'size:4'], 'featured_product_ids.*' => ['integer', 'distinct', Rule::exists('products', 'id')->where('active', true)],
            'hero' => ['required', 'array:eyebrow,headline,body,image,primary_label,primary_href,secondary_label,secondary_href'],
            'editorial' => ['required', 'array:headline,body,image,cta_label,cta_href'],
        ];
        foreach (['hero', 'editorial'] as $section) {
            $rules[$section.'.headline'] = ['required', 'string', 'max:100'];
            $rules[$section.'.body'] = ['required', 'string', 'max:350'];
            $rules[$section.'.image'] = ['required', 'string', 'max:2048', new ImageLocation];
        }
        $rules['hero.eyebrow'] = ['required', 'string', 'max:80'];
        foreach (['hero.primary', 'hero.secondary', 'editorial.cta'] as $button) {
            $rules[$button.'_label'] = ['required', 'string', 'max:40'];
            $rules[$button.'_href'] = ['required', Rule::in(self::destinations())];
        }
        return $rules;
    }
}
