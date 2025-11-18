# Script para diagnosticar problemas de SendGrid

Write-Host "🔍 Diagnosticando problema de SendGrid..." -ForegroundColor Yellow
Write-Host ""

$emailServiceUrl = "https://email-service-hkvt.onrender.com"

# 1. Verificar configuración
Write-Host "1. Verificando configuración del servicio..." -ForegroundColor Cyan
try {
    $health = Invoke-WebRequest -Uri "$emailServiceUrl/api/v1/emails/health" -Method GET
    $healthData = $health.Content | ConvertFrom-Json
    
    Write-Host "✅ Provider: $($healthData.email_provider)" -ForegroundColor Green
    Write-Host "✅ SendGrid configurado: $($healthData.sendgrid_configured)" -ForegroundColor Green
    
    if ($healthData.sendgrid_configured -eq $false) {
        Write-Host "❌ PROBLEMA: SendGrid no está configurado correctamente" -ForegroundColor Red
        Write-Host "💡 Solución: Verifica SENDGRID_API_KEY en Render Dashboard" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error verificando configuración: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 2. Probar con email simple
Write-Host "2. Probando envío de email simple..." -ForegroundColor Cyan

$testEmail = @{
    to_email = "test@example.com"  # Email simple para prueba
    subject = "Test de diagnóstico"
    body = "Este es un email de prueba para diagnosticar el error 403"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$emailServiceUrl/api/v1/emails/send" -Method POST -Body $testEmail -ContentType "application/json" -TimeoutSec 30
    Write-Host "✅ Email enviado correctamente" -ForegroundColor Green
} catch {
    $errorMessage = $_.Exception.Message
    Write-Host "❌ Error enviando email: $errorMessage" -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        try {
            $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
            Write-Host "📄 Detalles del error:" -ForegroundColor Yellow
            Write-Host "   Mensaje: $($errorDetails.message)" -ForegroundColor White
            if ($errorDetails.error) {
                Write-Host "   Error: $($errorDetails.error)" -ForegroundColor White
            }
        } catch {
            Write-Host "📄 Detalles raw: $($_.ErrorDetails.Message)" -ForegroundColor White
        }
    }
    
    # Análisis del error
    if ($errorMessage -like "*403*" -or $errorMessage -like "*Forbidden*") {
        Write-Host ""
        Write-Host "🔍 DIAGNÓSTICO DEL ERROR 403:" -ForegroundColor Yellow
        Write-Host "   El error 403 Forbidden en SendGrid indica:" -ForegroundColor White
        Write-Host ""
        Write-Host "   ❌ POSIBLES CAUSAS:" -ForegroundColor Red
        Write-Host "   1. API Key inválida o expirada" -ForegroundColor White
        Write-Host "   2. API Key sin permisos suficientes" -ForegroundColor White
        Write-Host "   3. Email 'from' no verificado en SendGrid" -ForegroundColor White
        Write-Host "   4. Dominio del email no verificado" -ForegroundColor White
        Write-Host "   5. Cuenta de SendGrid suspendida o con límites" -ForegroundColor White
        Write-Host ""
        Write-Host "   ✅ SOLUCIONES:" -ForegroundColor Green
        Write-Host "   1. Crear nueva API Key en SendGrid Dashboard" -ForegroundColor White
        Write-Host "      → https://app.sendgrid.com/settings/api_keys" -ForegroundColor Cyan
        Write-Host "      → Usar 'Full Access' para pruebas" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "   2. Verificar email 'from' en SendGrid" -ForegroundColor White
        Write-Host "      → https://app.sendgrid.com/settings/sender_auth" -ForegroundColor Cyan
        Write-Host "      → Verificar: deyvid.cruz@uptc.edu.co" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "   3. Usar email verificado como fallback temporal:" -ForegroundColor White
        Write-Host "      → Cambiar SENDGRID_FROM_EMAIL en Render a un email ya verificado" -ForegroundColor Cyan
    }
}

Write-Host ""
Write-Host "📋 PASOS RECOMENDADOS:" -ForegroundColor Yellow
Write-Host "1. Ve a SendGrid Dashboard" -ForegroundColor White
Write-Host "2. Crea nueva API Key con Full Access" -ForegroundColor White
Write-Host "3. Verifica el email deyvid.cruz@uptc.edu.co" -ForegroundColor White
Write-Host "4. Actualiza SENDGRID_API_KEY en Render" -ForegroundColor White
Write-Host "5. Redeploy el servicio" -ForegroundColor White
Write-Host "6. Ejecuta este script nuevamente" -ForegroundColor White

Write-Host ""
Write-Host "🔗 Enlaces útiles:" -ForegroundColor Cyan
Write-Host "• SendGrid API Keys: https://app.sendgrid.com/settings/api_keys" -ForegroundColor Blue
Write-Host "• Sender Authentication: https://app.sendgrid.com/settings/sender_auth" -ForegroundColor Blue
Write-Host "• Render Dashboard: https://dashboard.render.com" -ForegroundColor Blue