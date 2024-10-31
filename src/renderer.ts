const fetchSignIn = async (email: string, password: string) => {
  const data = await fetch(`${window.config.API_URL}/auth/sign-in`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password, isElectron: true })
  });

  const result = await data.json();

  return result;
};

const fetchMe = async () => {
  const data = await fetch(`${window.config.API_URL}/auth/me`, {
    headers: {
      'Content-Type': 'application/json'
    }
  });

  const result = await data.json();

  return result;
};

const fetchProjects = async () => {
  const data = await fetch(`${window.config.API_URL}/projects`, {
    headers: {
      'Content-Type': 'application/json'
    }
  });

  const result = await data.json();

  return result;
};

const showLoginForm = () => {
  const loginForm = document.getElementById('login-form');

  loginForm.style.display = 'flex';
};

const hideLoginForm = () => {
  const loginForm = document.getElementById('login-form');

  loginForm.style.display = 'none';
};

const showLoggedContainer = () => {
  const loggedContainer = document.getElementById('logged-container');

  loggedContainer.style.display = 'flex';
};

const fillLoggedContainer = ({
  first_name,
  last_name
}: {
  first_name: string;
  last_name: string;
}) => {
  const userElement = document.getElementById('user');

  userElement.innerText = `Hello ${first_name} ${last_name}`;
};

const hideLoggedContainer = () => {
  const loggedContainer = document.getElementById('logged-container');

  loggedContainer.style.display = 'none';
};

const showProjectContainer = () => {
  const projectContainer = document.getElementById('project-container');

  projectContainer.style.display = 'flex';
};

const fillProjectContainer = (options: Array<{ id: string; name: string }>) => {
  const projectsDropdown = document.getElementById('projects-dropdown');

  options.forEach((option) => {
    const opt = document.createElement('option');

    opt.value = option.id;
    opt.innerHTML = option.name;

    projectsDropdown.appendChild(opt);
  });
};

const hideProjectContainer = () => {
  const projectContainer = document.getElementById('project-container');

  projectContainer.style.display = 'none';
};

const showLoadingContainer = () => {
  const loadingContainer = document.getElementById('loading-container');

  loadingContainer.style.display = 'flex';
};

const hideLoadingContainer = () => {
  const loadingContainer = document.getElementById('loading-container');

  loadingContainer.style.display = 'none';
};

const afterLogin = async ({ first_name, last_name }: { first_name: string; last_name: string }) => {
  hideLoginForm();

  showLoggedContainer();
  fillLoggedContainer({ first_name, last_name });

  const projectsResponse = await fetchProjects();

  if (projectsResponse.statusCode === 401) {
    showLoginForm();
    hideLoggedContainer();

    return;
  }

  const projects = projectsResponse.data.projects;

  showProjectContainer();
  fillProjectContainer(
    projects.map(({ id, name }: { id: string; name: string }) => ({ id, name }))
  );
};

window.addEventListener('DOMContentLoaded', async () => {
  hideLoginForm();
  hideLoggedContainer();
  hideProjectContainer();
  hideLoadingContainer();

  try {
    const meResponse = await fetchMe();

    if (meResponse.statusCode === 401) {
      showLoginForm();

      return;
    }

    const user = meResponse.data.user;

    await afterLogin({ first_name: user.first_name, last_name: user.last_name });
  } catch (error) {
    // eslint-disable-next-line no-alert
    alert(`Auto Login error:${(error as Error).message}`);
  }
});

document.getElementById('login-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = (document.getElementById('email') as HTMLInputElement).value.trim();
  const password = (document.getElementById('password') as HTMLInputElement).value.trim();

  try {
    const authResponse = await fetchSignIn(email, password);

    // eslint-disable-next-line no-alert
    alert(authResponse.message);

    const user = authResponse.data.user;

    if (user) {
      await afterLogin({ first_name: user.first_name, last_name: user.last_name });
    }
  } catch (error) {
    // eslint-disable-next-line no-alert
    alert(`Login error:${(error as Error).message}`);
  }
});

document.getElementById('start-server-button').addEventListener('click', () => {
  const projectsDropdown = document.getElementById('projects-dropdown') as HTMLSelectElement;

  projectsDropdown.disabled = true;

  const startServerButton = document.getElementById('start-server-button');

  startServerButton.style.display = 'none';

  showLoadingContainer();
});
