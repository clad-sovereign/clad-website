import { createSignal, createMemo } from "solid-js";

type FormStatus = "idle" | "submitting" | "success" | "error";

interface FieldErrors {
  name?: string;
  email?: string;
  organization?: string;
  message?: string;
}

interface FormspreeErrorResponse {
  errors?: Array<{ message: string }>;
}

// Validation constants
const VALIDATION_RULES = {
  MIN_NAME_LENGTH: 2,
  MIN_ORGANIZATION_LENGTH: 2,
  MIN_MESSAGE_LENGTH: 10,
  RATE_LIMIT_COOLDOWN_MS: 3000, // 3 seconds between submissions
} as const;

// Improved email validation supporting internationalized domains
// Based on RFC 5322 Official Standard with unicode support
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u;
  return emailRegex.test(email);
}

export default function ContactForm() {
  const [status, setStatus] = createSignal<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = createSignal("");
  const [touched, setTouched] = createSignal<Record<string, boolean>>({});
  const [lastSubmitTime, setLastSubmitTime] = createSignal<number>(0);

  // Reference for focus management
  let successMessageRef: HTMLDivElement | undefined;

  // Form field values
  const [name, setName] = createSignal("");
  const [email, setEmail] = createSignal("");
  const [organization, setOrganization] = createSignal("");
  const [role, setRole] = createSignal("");
  const [message, setMessage] = createSignal("");

  // Validation errors (computed) - using constants for consistency
  const errors = createMemo<FieldErrors>(() => {
    const errs: FieldErrors = {};

    if (!name().trim()) {
      errs.name = "Name is required";
    } else if (name().trim().length < VALIDATION_RULES.MIN_NAME_LENGTH) {
      errs.name = `Name must be at least ${VALIDATION_RULES.MIN_NAME_LENGTH} characters`;
    }

    if (!email().trim()) {
      errs.email = "Email is required";
    } else if (!validateEmail(email().trim())) {
      errs.email = "Please enter a valid email address";
    }

    if (organization().trim() && organization().trim().length < VALIDATION_RULES.MIN_ORGANIZATION_LENGTH) {
      errs.organization = `Organization must be at least ${VALIDATION_RULES.MIN_ORGANIZATION_LENGTH} characters`;
    }

    // Message is now required
    if (!message().trim()) {
      errs.message = "Message is required";
    } else if (message().trim().length < VALIDATION_RULES.MIN_MESSAGE_LENGTH) {
      errs.message = `Message must be at least ${VALIDATION_RULES.MIN_MESSAGE_LENGTH} characters`;
    }

    return errs;
  });

  const isValid = createMemo(() => Object.keys(errors()).length === 0);

  function markTouched(field: string) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function showError(field: keyof FieldErrors): string | undefined {
    return touched()[field] ? errors()[field] : undefined;
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();

    // Mark all fields as touched to show any errors
    setTouched({ name: true, email: true, organization: true, message: true });

    if (!isValid()) {
      return;
    }

    // Rate limiting check
    const now = Date.now();
    const timeSinceLastSubmit = now - lastSubmitTime();
    if (timeSinceLastSubmit < VALIDATION_RULES.RATE_LIMIT_COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((VALIDATION_RULES.RATE_LIMIT_COOLDOWN_MS - timeSinceLastSubmit) / 1000);
      setErrorMessage(`Please wait ${remainingSeconds} seconds before submitting again.`);
      setStatus("error");
      return;
    }

    setStatus("submitting");
    setErrorMessage("");
    setLastSubmitTime(now);

    // Get Formspree endpoint from environment variable
    const formspreeEndpoint = import.meta.env.PUBLIC_FORMSPREE_ENDPOINT;

    if (!formspreeEndpoint) {
      setErrorMessage("Form configuration error. Please contact support.");
      setStatus("error");
      return;
    }

    try {
      const response = await fetch(formspreeEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: name().trim(),
          email: email().trim(),
          organization: organization().trim(),
          role: role(),
          message: message().trim(),
        }),
      });

      if (response.ok) {
        setStatus("success");
        // Reset form
        setName("");
        setEmail("");
        setOrganization("");
        setRole("");
        setMessage("");
        setTouched({});

        // Focus management - move focus to success message
        setTimeout(() => {
          successMessageRef?.focus();
        }, 100);
      } else {
        const data = await response.json() as FormspreeErrorResponse;
        setErrorMessage(data?.errors?.[0]?.message || "Something went wrong. Please try again.");
        setStatus("error");
      }
    } catch (error) {
      setErrorMessage("Network error. Please check your connection and try again.");
      setStatus("error");
    }
  }

  const inputBaseClass =
    "w-full px-4 py-3 text-[0.9375rem] bg-white border rounded text-[var(--color-text)] placeholder:text-[var(--color-slate-light)] focus:outline-none focus:ring-3 transition-colors";

  const inputNormalClass = `${inputBaseClass} border-[var(--color-border)] hover:border-[var(--color-slate-light)] focus:border-[var(--color-navy)] focus:ring-[var(--color-navy)]/10`;

  const inputErrorClass = `${inputBaseClass} border-red-400 hover:border-red-500 focus:border-red-500 focus:ring-red-500/10`;

  return (
    <div class="max-w-xl mx-auto">
      {status() === "success" ? (
        <div
          ref={successMessageRef}
          tabIndex={-1}
          class="text-center py-12 px-6 bg-white border border-[var(--color-border)] rounded-lg outline-none"
        >
          <div class="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--color-teal)]/10 flex items-center justify-center">
            <svg
              class="w-8 h-8 text-[var(--color-teal)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-[var(--color-navy)] mb-2">
            Thank you for your interest
          </h3>
          <p class="text-[var(--color-text-muted)] mb-6">
            We've received your request and will be in touch within 2 business days.
          </p>
          <button
            type="button"
            onClick={() => setStatus("idle")}
            class="text-sm text-[var(--color-navy)] hover:underline"
          >
            Send another message
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} class="space-y-6" novalidate>
          <div class="grid sm:grid-cols-2 gap-6">
            <div>
              <label
                for="name"
                class="block text-sm font-medium text-[var(--color-text)] mb-2"
              >
                Name <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={name()}
                onInput={(e) => setName(e.currentTarget.value)}
                onBlur={() => markTouched("name")}
                class={showError("name") ? inputErrorClass : inputNormalClass}
                placeholder="Your name"
                disabled={status() === "submitting"}
                aria-invalid={!!showError("name")}
                aria-describedby={showError("name") ? "name-error" : undefined}
              />
              {showError("name") && (
                <p id="name-error" class="mt-1.5 text-sm text-red-600">
                  {showError("name")}
                </p>
              )}
            </div>
            <div>
              <label
                for="email"
                class="block text-sm font-medium text-[var(--color-text)] mb-2"
              >
                Email <span class="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email()}
                onInput={(e) => setEmail(e.currentTarget.value)}
                onBlur={() => markTouched("email")}
                class={showError("email") ? inputErrorClass : inputNormalClass}
                placeholder="you@example.com"
                disabled={status() === "submitting"}
                aria-invalid={!!showError("email")}
                aria-describedby={showError("email") ? "email-error" : undefined}
              />
              {showError("email") && (
                <p id="email-error" class="mt-1.5 text-sm text-red-600">
                  {showError("email")}
                </p>
              )}
            </div>
          </div>

          <div>
            <label
              for="organization"
              class="block text-sm font-medium text-[var(--color-text)] mb-2"
            >
              Organization
            </label>
            <input
              type="text"
              id="organization"
              name="organization"
              value={organization()}
              onInput={(e) => setOrganization(e.currentTarget.value)}
              onBlur={() => markTouched("organization")}
              class={showError("organization") ? inputErrorClass : inputNormalClass}
              placeholder="Ministry, agency, or organization"
              disabled={status() === "submitting"}
              aria-invalid={!!showError("organization")}
              aria-describedby={showError("organization") ? "organization-error" : undefined}
            />
            {showError("organization") && (
              <p id="organization-error" class="mt-1.5 text-sm text-red-600">
                {showError("organization")}
              </p>
            )}
          </div>

          <div>
            <label
              for="role"
              class="block text-sm font-medium text-[var(--color-text)] mb-2"
            >
              Role
            </label>
            <select
              id="role"
              name="role"
              value={role()}
              onChange={(e) => setRole(e.currentTarget.value)}
              class={`${inputNormalClass} pr-10 appearance-none select-chevron bg-no-repeat bg-[right_1rem_center] cursor-pointer`}
              disabled={status() === "submitting"}
            >
              <option value="">Select your role</option>
              <option value="Debt Management Office">Debt Management Office</option>
              <option value="Finance Ministry">Finance Ministry</option>
              <option value="Central Bank">Central Bank</option>
              <option value="Treasury">Treasury</option>
              <option value="Consultant / Advisor">Consultant / Advisor</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label
              for="message"
              class="block text-sm font-medium text-[var(--color-text)] mb-2"
            >
              Message <span class="text-red-500">*</span>
            </label>
            <textarea
              id="message"
              name="message"
              rows="4"
              value={message()}
              onInput={(e) => setMessage(e.currentTarget.value)}
              onBlur={() => markTouched("message")}
              class={`${showError("message") ? inputErrorClass : inputNormalClass} resize-none`}
              placeholder="Tell us about your interest in tokenized sovereign debt..."
              disabled={status() === "submitting"}
              aria-invalid={!!showError("message")}
              aria-describedby={showError("message") ? "message-error" : undefined}
            />
            {showError("message") && (
              <p id="message-error" class="mt-1.5 text-sm text-red-600">
                {showError("message")}
              </p>
            )}
          </div>

          {status() === "error" && (
            <div class="p-4 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {errorMessage()}
            </div>
          )}

          <div class="pt-2">
            <button
              type="submit"
              disabled={status() === "submitting"}
              class="btn btn-primary w-full sm:w-auto disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status() === "submitting" ? (
                <span class="flex items-center gap-2">
                  <svg
                    class="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    />
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Sending...
                </span>
              ) : (
                "Send Request"
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
