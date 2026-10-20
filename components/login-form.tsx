"use client";
import { useActionState } from "react";
import { LockKeyhole, LoaderCircle, House } from "lucide-react";
import { login } from "@/app/auth-actions";
import { Button, Input } from "./ui";
export function LoginForm() {
  const [state, action, pending] = useActionState(login, { error: "" });
  return (
    <main className="login-shell">
      <section className="login-card">
        <span className="brand-icon">
          <House size={25} />
        </span>
        <h1>ورود به خانه‌نما</h1>
        <p className="muted">
          برای مشاهده و مدیریت قیمت‌ها، رمز ورود را وارد کنید.
        </p>
        <form action={action} className="form">
          <label htmlFor="password">رمز ورود</label>
          <Input
            id="password"
            name="password"
            type="password"
            dir="ltr"
            required
            maxLength={128}
            autoComplete="current-password"
            disabled={pending}
            aria-invalid={!!state.error}
            aria-describedby={state.error ? "login-error" : undefined}
          />
          {state.error && (
            <p id="login-error" role="alert" className="field-error">
              {state.error}
            </p>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? (
              <LoaderCircle size={17} className="spin" />
            ) : (
              <LockKeyhole size={17} />
            )}
            ورود
          </Button>
        </form>
        <p className="login-note">ورود شما تا یک هفته معتبر می‌ماند.</p>
      </section>
    </main>
  );
}
