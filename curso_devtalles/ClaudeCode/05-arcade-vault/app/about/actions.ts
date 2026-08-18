"use server";

import { Resend } from "resend";

export type ContactPayload = {
  name: string;
  email: string;
  msg: string;
};

export type ContactResult = { ok: true } | { ok: false; error: string };

export async function sendContactMessage(
  payload: ContactPayload
): Promise<ContactResult> {
  const name = payload.name.trim();
  const email = payload.email.trim();
  const msg = payload.msg.trim();

  if (!name || !email || !msg) {
    return { ok: false, error: "Todos los campos son obligatorios." };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const result = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: process.env.CONTACT_TO_EMAIL!,
      replyTo: email,
      subject: `Nuevo mensaje de contacto de ${name}`,
      text: `Nombre: ${name}\nCorreo: ${email}\n\nMensaje:\n${msg}`,
    });

    if (result.error) {
      return {
        ok: false,
        error: "No se pudo enviar el mensaje. Intenta de nuevo más tarde.",
      };
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "No se pudo enviar el mensaje. Intenta de nuevo más tarde.",
    };
  }
}
