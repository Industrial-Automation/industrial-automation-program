document.getElementById('login-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = (document.getElementById('email') as HTMLInputElement).value.trim();
  const password = (document.getElementById('email') as HTMLInputElement).value.trim();

  try {
    const response = await fetch(`${window.config.API_URL}/auth/sign-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const result = await response.json();

    // eslint-disable-next-line no-alert
    alert(result.message);

    if (response.ok) {
      // eslint-disable-next-line no-console
      console.log(result);
    }
  } catch (error) {
    // eslint-disable-next-line no-alert
    alert(`Login error:${(error as Error).message}`);
  }
});
