<?php

return [

    'default' => env('FILESYSTEM_DISK', 'public'),

    'disks' => [

        'local' => [
            'driver' => 'local',
            'root' => storage_path('app/private'),
            'serve' => true,
            'throw' => false,
        ],

        // Disque public : les ressources pedagogiques (PDF, docx, images...)
        // sont stockees ici et servies via /storage apres `php artisan storage:link`.
        'public' => [
            'driver' => 'local',
            'root' => storage_path('app/public'),
            'url' => env('APP_URL').'/storage',
            'visibility' => 'public',
            'throw' => false,
        ],

    ],

    // Lien symbolique public/storage -> storage/app/public
    'links' => [
        public_path('storage') => storage_path('app/public'),
    ],

];
