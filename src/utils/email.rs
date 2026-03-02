use lettre::{
    message::header::ContentType, transport::smtp::authentication::Credentials, AsyncSmtpTransport,
    AsyncTransport, Message, Tokio1Executor,
};

pub async fn send_email(to: &str, subject: &str, html_body: String) -> Result<(), String> {
    let smtp_user = std::env::var("MAIL_USER").unwrap_or_default();
    let smtp_pass = std::env::var("MAIL_PASS").unwrap_or_default();
    let smtp_host = std::env::var("MAIL_HOST").unwrap_or_else(|_| "smtp.gmail.com".into());

    let email = Message::builder()
        .from(smtp_user.parse().map_err(|e| format!("{}", e))?)
        .to(to.parse().map_err(|e| format!("{}", e))?)
        .subject(subject)
        .header(ContentType::TEXT_HTML)
        .body(html_body)
        .map_err(|e| format!("{}", e))?;

    let creds = Credentials::new(smtp_user, smtp_pass);
    let mailer: AsyncSmtpTransport<Tokio1Executor> =
        AsyncSmtpTransport::<Tokio1Executor>::relay(&smtp_host)
            .map_err(|e| format!("{}", e))?
            .credentials(creds)
            .build();

    mailer.send(email).await.map_err(|e| format!("{}", e))?;
    Ok(())
}

pub fn forgot_password_email(new_pass: &str) -> String {
    format!(
        "<p>Your new password is: <strong>{}</strong></p><p>Please change it after login.</p>",
        new_pass
    )
}
