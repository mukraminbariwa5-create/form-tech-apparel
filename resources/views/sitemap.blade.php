<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
@foreach ($urls as $url)
    <url><loc>{{ $url['loc'] }}</loc>@if ($url['modified'])<lastmod>{{ $url['modified'] }}</lastmod>@endif</url>
@endforeach
</urlset>
