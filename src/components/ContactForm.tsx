import { createSignal, createMemo } from "solid-js";

type FormStatus = "idle" | "submitting" | "success" | "error";

interface FieldErrors {
  name?: string;
  email?: string;
  organization?: string;
  message?: string;
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function ContactForm() {
  const [status, setStatus] = createSignal<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = createSignal("");
  const [touched, setTouched] = createSignal<Record<string, boolean>>({});

  // Form field values
  const [name, setName] = createSignal("");
  const [email, setEmail] = createSignal("");
  const [organization, setOrganization] = createSignal("");
  const [role, setRole] = createSignal("");
  const [message, setMessage] = createSignal("");

  // Validation errors (computed)
  const errors = createMemo<FieldErrors>(() => {
    const errs: FieldErrors = {};

    if (!name().trim()) {
      errs.name = "Name is required";
    } else if (name().trim().length < 2) {
      errs.name = "Name must be at least 2 characters";
    }

    if (!email().trim()) {
      errs.email = "Email is required";
    } else if (!validateEmail(email().trim())) {
      errs.email = "Please enter a valid email address";
    }

    if (organization().trim() && organization().trim().length < 2) {
      errs.organization = "Organization must be at least 2 characters";
    }

    if (message().trim() && message().trim().length < 10) {
      errs.message = "Message must be at least 10 characters";
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

    setStatus("submitting");
    setErrorMessage("");

    try {
      const response = await fetch("https://formspree.io/f/xdkvlojo", {
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
      } else {
        const data = await response.json();
        setErrorMessage(data?.errors?.[0]?.message || "Something went wrong. Please try again.");
        setStatus("error");
      }
    } catch {
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
        <div class="text-center py-12 px-6 bg-white border border-[var(--color-border)] rounded-lg">
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
              class={`${inputNormalClass} pr-10 appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%234a5568%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_1rem_center] cursor-pointer`}
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
              Message
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
