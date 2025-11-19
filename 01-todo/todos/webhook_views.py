import hashlib
import hmac
import json
import logging
import subprocess

from django.conf import settings
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

logger = logging.getLogger(__name__)


def verify_github_signature(request):
    """Verify that the request came from GitHub using the webhook secret."""
    # Get the signature from the header
    signature_header = request.headers.get("X-Hub-Signature-256")
    if not signature_header:
        return False

    # Get the secret from settings
    secret = getattr(settings, "GITHUB_WEBHOOK_SECRET", None)
    if not secret:
        logger.warning("GITHUB_WEBHOOK_SECRET not configured")
        return True  # Allow if no secret is configured (for initial setup)

    # Compute the expected signature
    secret_bytes = secret.encode("utf-8")
    body_bytes = request.body
    expected_signature = "sha256=" + hmac.new(secret_bytes, body_bytes, hashlib.sha256).hexdigest()

    # Compare signatures
    return hmac.compare_digest(signature_header, expected_signature)


@csrf_exempt
@require_POST
def github_webhook(request):
    """Handle GitHub webhook push events."""
    # Verify the request came from GitHub
    if not verify_github_signature(request):
        logger.warning("Invalid GitHub webhook signature")
        return HttpResponse("Invalid signature", status=403)

    # Get the event type
    event_type = request.headers.get("X-GitHub-Event")

    # Only handle push events
    if event_type != "push":
        return JsonResponse({"status": "ignored", "reason": f"Event type: {event_type}"})

    try:
        payload = json.loads(request.body)
    except json.JSONDecodeError:
        return HttpResponse("Invalid JSON", status=400)

    # Check if this is a push to main branch
    ref = payload.get("ref", "")
    if ref != "refs/heads/main":
        return JsonResponse({"status": "ignored", "reason": f"Not main branch: {ref}"})

    # Log the deployment request
    pusher = payload.get("pusher", {}).get("name", "unknown")
    commits = payload.get("commits", [])
    commit_count = len(commits)

    logger.info(f"Deployment triggered by {pusher} with {commit_count} commit(s) to main")

    # Trigger deployment in background
    try:
        # Run the deploy management command
        subprocess.Popen(
            ["python", "manage.py", "deploy"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )

        return JsonResponse(
            {
                "status": "success",
                "message": f"Deployment started for {commit_count} commit(s)",
                "pusher": pusher,
            }
        )

    except Exception as e:
        logger.error(f"Failed to trigger deployment: {str(e)}")
        return JsonResponse(
            {"status": "error", "message": str(e)},
            status=500,
        )
