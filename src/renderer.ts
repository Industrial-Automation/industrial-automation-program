document.getElementById('login-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = (document.getElementById('email') as HTMLInputElement).value.trim();
  const password = (document.getElementById('password') as HTMLInputElement).value.trim();

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
      const user = result.data.user;

      const form = document.getElementById('login-form');
      const loggedElement = document.getElementById('logged');
      const userElement = document.getElementById('user');

      form.style.display = 'none';
      loggedElement.style.display = 'flex';

      userElement.innerText = `Hello ${user.first_name} ${user.last_name}`;
    }
  } catch (error) {
    // eslint-disable-next-line no-alert
    alert(`Login error:${(error as Error).message}`);
  }
});
