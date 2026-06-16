<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Liste des notifications in-app de l'utilisateur + nombre de non-lues.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $items = $user->notifications()->latest()->limit(50)->get()->map(fn ($n) => [
            'id' => $n->id,
            'data' => $n->data,
            'read' => $n->read_at !== null,
            'created_at' => optional($n->created_at)->toIso8601String(),
        ]);

        return response()->json([
            'data' => $items,
            'unread' => $user->unreadNotifications()->count(),
        ]);
    }

    public function markRead(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()->notifications()->where('id', $id)->first();
        if ($notification) {
            $notification->markAsRead();
        }

        return response()->json(['message' => 'Notification lue.']);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json(['message' => 'Toutes les notifications sont lues.']);
    }

 