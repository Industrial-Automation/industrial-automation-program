interface LoggedUserType {
  id: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  is_confirmed: boolean;
}

interface ProjectType {
  id: string;
  name: string;
  opc_url: string;
  opc_namespace_index: number;
  created_at: string;
  last_updated_at: string;
}

interface StateType {
  user: LoggedUserType | null;
  projects: ProjectType[];
}

const State: StateType = {
  user: null,
  projects: []
};

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

const fillLoggedContainer = () => {
  const userElement = document.getElementById('user');

  userElement.innerText = `Hello ${State.user.first_name} ${State.user.last_name}`;
};

const hideLoggedContainer = () => {
  const loggedContainer = document.getElementById('logged-container');

  loggedContainer.style.display = 'none';
};

const showProjectContainer = () => {
  const projectContainer = document.getElementById('project-container');

  projectContainer.style.display = 'flex';
};

const fillProjectContainer = () => {
  const projectsDropdown = document.getElementById('projects-dropdown');

  State.projects.forEach((option) => {
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

const afterLogin = async () => {
  hideLoginForm();

  showLoggedContainer();
  fillLoggedContainer();

  const projectsResponse = await fetchProjects();

  if (projectsResponse.statusCode === 401) {
    showLoginForm();
    hideLoggedContainer();

    return;
  }

  const projects = projectsResponse.data.projects as ProjectType[];

  State.projects = projects;

  showProjectContainer();
  fillProjectContainer();
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

    const user = meResponse.data.user as LoggedUserType;

    State.user = user;

    await afterLogin();
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

    if (!authResponse.data.user) {
      return;
    }

    const user = authResponse.data.user as LoggedUserType;

    State.user = user;

    await afterLogin();
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

  const currentProject = State.projects.find((project) => project.id === projectsDropdown.value);

  window.api.startOPCClient(
    currentProject.id,
    currentProject.opc_url,
    currentProject.opc_namespace_index
  );

  window.api.onOPCClientResponse((message) => {
    const spinnerText = document.getElementById('spinner-text');

    spinnerText.innerText = message;
  });

  showLoadingContainer();
});
