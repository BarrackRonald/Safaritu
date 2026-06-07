<?php

class CallBackController
{
    private CallBackRequest $model;

    public function __construct()
    {
        $this->model = new CallBackRequest();
    }

    /**
     * Handle POST /callback
     * - Validates input
     * - Saves to call_back_requests table
     * - Emails ceo@envirometricsinternational.co.ke
     * - Redirects back with a flash message
     */
    public function store(): void
    {
        // ── 1. Sanitise & validate ────────────────────────────────────────────
        $name    = trim($_POST['name']            ?? '');
        $phone   = trim($_POST['phone']           ?? '');
        $service = trim($_POST['service_interest'] ?? '');

        if ($name === '' || $phone === '') {
            flash('error', 'Name and phone number are required.');
            redirect('/');          // adjust to your redirect helper
            return;
        }

        // ── 2. Persist to database ────────────────────────────────────────────
        $this->model->create([
            'name'             => $name,
            'phone'            => $phone,
            'service_interest' => $service,
            'status'           => 'pending',
            'submitted_at'     => date('Y-m-d H:i:s'),
        ]);

        // ── 3. Send notification email ────────────────────────────────────────
        Mailer::callbackReceived([
            'name'             => $name,
            'phone'            => $phone,
            'service_interest' => $service,
        ]);

        // ── 4. Redirect with success flash ────────────────────────────────────
        flash('success', 'Thank you! We will call you back shortly.');
        redirect('/#callback');     // adjust anchor/path to suit your routing
    }
}