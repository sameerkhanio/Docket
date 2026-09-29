/* =========================================================================
   Docket API Configuration
   ========================================================================= */

const API_BASE =
  'https://2lh7yhwt92.execute-api.us-west-1.amazonaws.com/dev';


const CONFIG = {

  SIGNUP_URL:
    `${API_BASE}/signup`,

  LOGIN_URL:
    `${API_BASE}/login`,

  CREATE_DOCKET_URL:
    `${API_BASE}/create-file`,

  GET_DOCKETS_URL:
    `${API_BASE}/get-files`,

  UPDATE_DOCKET_URL:
    `${API_BASE}/update-files`,

  DELETE_DOCKET_URL:
    `${API_BASE}/delete-files`

};


/* =========================================================================
   STATE
   ========================================================================= */

let mode = 'login';

let currentUser = null;

let currentDockets = [];

let currentEditingDocket = null;

let docketToDelete = null;

let liveDateUpdateTimer = null;

let toastTimer = null;


/* =========================================================================
   ELEMENTS
   ========================================================================= */

const screens = {

  lock:
    document.getElementById('lock-screen'),

  auth:
    document.getElementById('auth-screen'),

  welcome:
    document.getElementById('welcome-screen'),

  service:
    document.getElementById('service-screen'),

  name:
    document.getElementById('name-screen'),

  editor:
    document.getElementById('editor-screen')

};


/* Auth */

const openAuthBtn =
  document.getElementById('open-auth-btn');

const backBtn =
  document.getElementById('back-btn');

const tabLogin =
  document.getElementById('tab-login');

const tabSignup =
  document.getElementById('tab-signup');

const fieldName =
  document.getElementById('field-name');

const inputName =
  document.getElementById('input-name');

const inputEmail =
  document.getElementById('input-email');

const inputPassword =
  document.getElementById('input-password');

const authForm =
  document.getElementById('auth-form');

const submitBtn =
  document.getElementById('submit-btn');

const formMsg =
  document.getElementById('form-msg');


/* Welcome */

const welcomeName =
  document.getElementById('welcome-name');

const enterServiceBtn =
  document.getElementById('enter-service-btn');

const serviceWho =
  document.getElementById('service-who');

const logoutBtn =
  document.getElementById('logout-btn');


/* Dashboard */

const createDocketBtn =
  document.getElementById('create-docket-btn');

const docketsList =
  document.getElementById('dockets-list');

const docketCount =
  document.getElementById('docket-count');


/* Name */

const newDocketName =
  document.getElementById('new-docket-name');

const nameMsg =
  document.getElementById('name-msg');

const cancelNameBtn =
  document.getElementById('cancel-name-btn');

const continueNameBtn =
  document.getElementById('continue-name-btn');


/* Editor */

const editorTopTitle =
  document.getElementById('editor-top-title');

const editorDocketName =
  document.getElementById('editor-docket-name');

const editorContent =
  document.getElementById('editor-content');

const saveDocketBtn =
  document.getElementById('save-docket-btn');

const backEditorBtn =
  document.getElementById('back-editor-btn');

const saveStatus =
  document.getElementById('save-status');

const editorWordCount =
  document.getElementById('editor-word-count');


/* Delete */

const deleteModal =
  document.getElementById('delete-modal');

const deleteModalName =
  document.getElementById('delete-modal-name');

const cancelDeleteBtn =
  document.getElementById('cancel-delete-btn');

const confirmDeleteBtn =
  document.getElementById('confirm-delete-btn');


/* Toast */

const toast =
  document.getElementById('toast');


/* =========================================================================
   SCREEN NAVIGATION
   ========================================================================= */

function showScreen(name) {

  Object.values(screens).forEach(
    screen => {

      screen.classList.remove(
        'active'
      );

    }
  );


  if (screens[name]) {

    screens[name].classList.add(
      'active'
    );

  }

}


/* =========================================================================
   AUTH NAVIGATION
   ========================================================================= */

openAuthBtn.addEventListener(
  'click',
  () => {

    setMode('login');

    showScreen('auth');

  }
);


backBtn.addEventListener(
  'click',
  () => {

    clearMsg();

    showScreen('lock');

  }
);


function setMode(newMode) {

  mode = newMode;


  tabLogin.classList.toggle(
    'active',
    mode === 'login'
  );


  tabSignup.classList.toggle(
    'active',
    mode === 'signup'
  );


  fieldName.style.display =
    mode === 'signup'
      ? 'block'
      : 'none';


  inputName.required =
    mode === 'signup';


  submitBtn.textContent =
    mode === 'signup'
      ? 'Create account'
      : 'Log in';


  clearMsg();

}


tabLogin.addEventListener(
  'click',
  () => setMode('login')
);


tabSignup.addEventListener(
  'click',
  () => setMode('signup')
);


/* =========================================================================
   AUTH MESSAGES
   ========================================================================= */

function clearMsg() {

  formMsg.textContent = '';

  formMsg.className =
    'form-msg';

}


function setMsg(
  text,
  type
) {

  formMsg.textContent =
    text;

  formMsg.className =
    'form-msg ' +
    (type || '');

}


/* =========================================================================
   AUTH FORM
   ========================================================================= */

authForm.addEventListener(
  'submit',
  async (e) => {

    e.preventDefault();

    clearMsg();


    const email =
      inputEmail.value.trim();

    const password =
      inputPassword.value;

    const name =
      inputName.value.trim();


    if (!email) {

      setMsg(
        'Enter your email address.',
        'error'
      );

      return;

    }


    if (
      mode === 'signup' &&
      !name
    ) {

      setMsg(
        'Enter your name to create an account.',
        'error'
      );

      return;

    }


    if (password.length < 6) {

      setMsg(
        'Password needs at least 6 characters.',
        'error'
      );

      return;

    }


    submitBtn.disabled = true;


    setMsg(
      mode === 'signup'
        ? 'Creating account…'
        : 'Checking credentials…',
      'info'
    );


    try {

      const result =
        await realAuthCall(
          mode,
          {
            name,
            email,
            password
          }
        );


      if (result.ok) {

  currentUser = {

    name:
      result.name ||
      name ||
      email.split('@')[0],

    email,

    token:
      result.token

  };


  localStorage.setItem(
    'docket_token',
    result.token
  );


  goToWelcome(
    currentUser.name
  );

} else {

        setMsg(
          result.message ||
          'That didn\'t work — check your details and try again.',
          'error'
        );

      }


    } catch (err) {

      console.error(
        'Authentication request failed:',
        err
      );


      setMsg(
        'Could not reach the server. Try again in a moment.',
        'error'
      );


    } finally {

      submitBtn.disabled = false;

    }

  }
);


/* =========================================================================
   AUTH API
   ========================================================================= */

async function realAuthCall(
  authMode,
  {
    name,
    email,
    password
  }
) {

  const url =
    authMode === 'signup'
      ? CONFIG.SIGNUP_URL
      : CONFIG.LOGIN_URL;


  /*
    IMPORTANT:

    Backend expects:
    Signup -> Name, Email, password
    Login  -> Email, password
  */

  const payload =
    authMode === 'signup'
      ? {

          Name:
            name,

          Email:
            email,

          password:
            password

        }
      : {

          Email:
            email,

          password:
            password

        };


  const response =
    await fetch(
      url,
      {

        method:
          'POST',

        headers: {

          'Content-Type':
            'application/json'

        },

        body:
          JSON.stringify(payload)

      }
    );


  const data =
    await response
      .json()
      .catch(
        () => ({})
      );


  if (!response.ok) {

    return {

      ok:
        false,

      message:
        data.message ||
        (
          authMode === 'signup'
            ? 'Could not create account.'
            : 'Login failed. Check email and password.'
        )

    };

  }


return {

  ok:
    true,

  name:
    data.name ||
    data.Name ||
    data.UserName ||
    name,

  token:
    data.token

};


}


/* =========================================================================
   WELCOME
   ========================================================================= */

function goToWelcome(
  name
) {

  welcomeName.textContent =
    `Welcome, ${name}`;


  serviceWho.textContent =
    name;


  showScreen(
    'welcome'
  );

}


enterServiceBtn.addEventListener(
  'click',
  async () => {

    showScreen(
      'service'
    );

    await loadDockets();

  }
);


/* =========================================================================
   DASHBOARD
   ========================================================================= */

async function loadDockets() {

  if (
    !currentUser ||
    !currentUser.email
  ) {

    return;

  }


  docketsList.innerHTML = `
    <div class="dashboard-loading">
      Loading your dockets…
    </div>
  `;


  try {

    /*
      Backend expects:

      GET /get-files?Email=user@example.com
    */

    const url =
      `${CONFIG.GET_DOCKETS_URL}?Email=${encodeURIComponent(
        currentUser.email
      )}`;


    const response =
      await fetch(
        url,
        {

          method:
            'GET',

          headers: {

            'Content-Type':
              'application/json',

            'Authorization':
                `Bearer ${currentUser.token}`

          }

        }
      );


    const data =
      await response
        .json()
        .catch(
          () => ({})
        );


    if (!response.ok) {

      throw new Error(
        data.message ||
        'Could not load dockets.'
      );

    }


    /*
      GET Lambda returns:

      {
        "files": [...]
      }
    */

    currentDockets =
      Array.isArray(
        data.files
      )
        ? data.files
        : [];


    currentDockets.sort(
      (a, b) => {

        const dateA =
          new Date(
            a.updatedAt ||
            a.createdAt ||
            0
          ).getTime();


        const dateB =
          new Date(
            b.updatedAt ||
            b.createdAt ||
            0
          ).getTime();


        return dateB - dateA;

      }
    );


    renderDockets();


  } catch (error) {

    console.error(
      'Get dockets failed:',
      error
    );


    docketsList.innerHTML = `
      <div class="empty-state">

        <div class="empty-icon">
          !
        </div>

        <h4>
          Could not load your dockets
        </h4>

        <p>
          We couldn't reach your workspace.
          Please try again.
        </p>

        <button
          class="btn"
          onclick="loadDockets()"
        >
          Try Again
        </button>

      </div>
    `;

  }

}


/* =========================================================================
   DOCKET RENDERING
   ========================================================================= */

function renderDockets() {

  const count =
    currentDockets.length;


  docketCount.textContent =
    `${count} ${
      count === 1
        ? 'docket'
        : 'dockets'
    }`;


  if (count === 0) {

    docketsList.innerHTML = `
      <div class="empty-state">

        <div class="empty-icon">
          +
        </div>

        <h4>
          Nothing here yet.
        </h4>

        <p>
          Your saved docket files will appear here.
          Start by creating your first one.
        </p>

        <button
          class="btn primary"
          onclick="startCreatingDocket()"
        >
          Create your first docket
        </button>

      </div>
    `;


    stopLiveDateUpdates();

    return;

  }


  docketsList.innerHTML =
    currentDockets
      .map(
        docket =>
          createDocketRow(docket)
      )
      .join('');


  startLiveDateUpdates();

}


/* =========================================================================
   DOCKET ROW
   ========================================================================= */

function createDocketRow(
  docket
) {

  /*
    IMPORTANT:

    DynamoDB key is now:

    Email
    id

    So frontend uses docket.id.
  */

  const id =
    escapeHtml(
      docket.id || ''
    );


  const name =
    escapeHtml(
      docket.UserName ||
      docket.docketName ||
      'Untitled Docket'
    );


  const timestamp =
    docket.updatedAt ||
    docket.createdAt ||
    '';


  const updated =
    formatDate(
      timestamp
    );


  return `
    <div
      class="docket-row"
      data-docket-id="${id}"
    >

      <div class="docket-info">

        <div class="docket-name">
          ${name}
        </div>

        <div
          class="docket-meta"
          data-updated-at="${escapeHtml(timestamp)}"
        >
          Edited ${updated}
        </div>

      </div>


      <div class="docket-actions">

        <button
          class="ghost-btn"
          onclick="openDocket('${escapeJs(
            docket.id || ''
          )}')"
        >
          Open
        </button>


        <button
          class="danger-btn"
          onclick="askDeleteDocket(
            '${escapeJs(
              docket.id || ''
            )}',
            '${escapeJs(
              docket.UserName ||
              docket.docketName ||
              'Untitled Docket'
            )}'
          )"
        >
          Delete
        </button>

      </div>

    </div>
  `;

}


/* =========================================================================
   CREATE DOCKET FLOW
   ========================================================================= */

createDocketBtn.addEventListener(
  'click',
  startCreatingDocket
);


function startCreatingDocket() {

  newDocketName.value =
    '';


  nameMsg.textContent =
    '';


  nameMsg.className =
    'form-msg';


  showScreen(
    'name'
  );


  setTimeout(
    () => {

      newDocketName.focus();

    },
    100
  );

}


cancelNameBtn.addEventListener(
  'click',
  () => {

    showScreen(
      'service'
    );

  }
);


continueNameBtn.addEventListener(
  'click',
  () => {

    const name =
      newDocketName.value.trim();


    if (!name) {

      nameMsg.textContent =
        'Give your docket a name first.';


      nameMsg.className =
        'form-msg error';


      newDocketName.focus();

      return;

    }


    currentEditingDocket = {

      isNew:
        true,

      id:
        null,

      UserName:
        name,

      content:
        ''

    };


    openEditor(
      currentEditingDocket
    );

  }
);


newDocketName.addEventListener(
  'keydown',
  (e) => {

    if (
      e.key === 'Enter'
    ) {

      e.preventDefault();

      continueNameBtn.click();

    }

  }
);


/* =========================================================================
   EDITOR
   ========================================================================= */

function openEditor(
  docket
) {

  currentEditingDocket =
    docket;


  editorDocketName.value =
    docket.UserName ||
    docket.docketName ||
    'Untitled Docket';


  editorContent.value =
    docket.content ||
    '';


  editorTopTitle.textContent =
    docket.UserName ||
    docket.docketName ||
    'Untitled Docket';


  updateWordCount();


  setSaveStatus(
    'Ready'
  );


  saveDocketBtn.textContent =
    docket.isNew
      ? 'Save Docket'
      : 'Save Changes';


  showScreen(
    'editor'
  );

}


editorDocketName.addEventListener(
  'input',
  () => {

    editorTopTitle.textContent =
      editorDocketName.value.trim() ||
      'Untitled Docket';

  }
);


editorContent.addEventListener(
  'input',
  updateWordCount
);


function updateWordCount() {

  const text =
    editorContent.value.trim();


  const words =
    text
      ? text.split(/\s+/).length
      : 0;


  editorWordCount.textContent =
    `${words} ${
      words === 1
        ? 'word'
        : 'words'
    }`;

}


backEditorBtn.addEventListener(
  'click',
  () => {

    showScreen(
      'service'
    );

  }
);


/* =========================================================================
   SAVE DOCKET
   ========================================================================= */

saveDocketBtn.addEventListener(
  'click',
  saveCurrentDocket
);


async function saveCurrentDocket() {

  if (
    !currentUser ||
    !currentUser.email
  ) {

    showToast(
      'Please log in again.',
      'error'
    );

    return;

  }


  const docketName =
    editorDocketName.value.trim();


  const content =
    editorContent.value;


  if (!docketName) {

    showToast(
      'Docket name cannot be empty.',
      'error'
    );


    editorDocketName.focus();

    return;

  }


  saveDocketBtn.disabled =
    true;


  setSaveStatus(
    'Saving…'
  );


  try {

    if (
      currentEditingDocket &&
      currentEditingDocket.isNew
    ) {

      await createDocket(
        docketName,
        content
      );

    } else {

      await updateDocket(
        currentEditingDocket.id,
        docketName,
        content
      );

    }


  } catch (error) {

    console.error(
      'Save docket failed:',
      error
    );


    setSaveStatus(
      'Save failed'
    );


    showToast(
      error.message ||
      'Could not save docket.',
      'error'
    );


  } finally {

    saveDocketBtn.disabled =
      false;

  }

}


/* =========================================================================
   CREATE DOCKET API
   ========================================================================= */

async function createDocket(
  docketName,
  content
) {

  /*
    Backend convention:

    Email
    UserName
    content
  */

  const response =
    await fetch(
      CONFIG.CREATE_DOCKET_URL,
      {

        method:
          'POST',

        headers: {

          'Content-Type':
            'application/json',

            'Authorization':
                `Bearer ${currentUser.token}`

        },

        body:
          JSON.stringify({

            Email:
              currentUser.email,

            UserName:
              docketName,

            content:
              content

          })

      }
    );


  const data =
    await response
      .json()
      .catch(
        () => ({})
      );


  if (!response.ok) {

    throw new Error(
      data.message ||
      'Could not create docket.'
    );

  }


  /*
    Support possible response names:
      docket
      File
      file
    */

  const savedDocket =
    data.docket ||
    data.File ||
    data.file;


  if (savedDocket) {

    currentEditingDocket = {

      ...savedDocket,

      isNew:
        false

    };

  }


  setSaveStatus(
    'Saved'
  );


  showToast(
    'Docket saved successfully.',
    'success'
  );


  await loadDockets();


  showScreen(
    'service'
  );

}


/* =========================================================================
   UPDATE DOCKET API
   ========================================================================= */

async function updateDocket(
  docketId,
  docketName,
  content
) {

  if (!docketId) {

    throw new Error(
      'Docket ID is missing.'
    );

  }


  /*
    Backend expects:

    Email
    id
    UserName
    content
  */

  const response =
    await fetch(
      CONFIG.UPDATE_DOCKET_URL,
      {

        method:
          'PUT',

        headers: {

          'Content-Type':
            'application/json',

           'Authorization':
                `Bearer ${currentUser.token}`

        },

        body:
          JSON.stringify({

            Email:
              currentUser.email,

            id:
              docketId,

            UserName:
              docketName,

            content:
              content

          })

      }
    );


  const data =
    await response
      .json()
      .catch(
        () => ({})
      );


  if (!response.ok) {

    throw new Error(
      data.message ||
      'Could not update docket.'
    );

  }


  /*
    Your update Lambda returns:

    {
      "message": "...",
      "File": {...}
    }
  */

  const updatedDocket =
    data.File ||
    data.file ||
    data.docket;


  if (updatedDocket) {

    currentEditingDocket = {

      ...updatedDocket,

      isNew:
        false

    };

  }


  setSaveStatus(
    'Saved'
  );


  showToast(
    'Changes saved successfully.',
    'success'
  );


  await loadDockets();


  showScreen(
    'service'
  );

}


/* =========================================================================
   OPEN EXISTING DOCKET
   ========================================================================= */

function openDocket(
  docketId
) {

  const docket =
    currentDockets.find(
      item =>
        String(item.id) ===
        String(docketId)
    );


  if (!docket) {

    showToast(
      'Docket could not be found.',
      'error'
    );

    return;

  }


  currentEditingDocket = {

    ...docket,

    isNew:
      false

  };


  openEditor(
    currentEditingDocket
  );

}


/* =========================================================================
   DELETE DOCKET
   ========================================================================= */

function askDeleteDocket(
  docketId,
  docketName
) {

  docketToDelete = {

    docketId,

    docketName

  };


  deleteModalName.textContent =
    `"${docketName}"`;


  deleteModal.classList.add(
    'active'
  );

}


cancelDeleteBtn.addEventListener(
  'click',
  closeDeleteModal
);


function closeDeleteModal() {

  deleteModal.classList.remove(
    'active'
  );


  docketToDelete =
    null;

}


confirmDeleteBtn.addEventListener(
  'click',
  async () => {

    if (!docketToDelete) {

      return;

    }


    confirmDeleteBtn.disabled =
      true;


    confirmDeleteBtn.textContent =
      'Deleting…';


    try {

      await deleteDocket(
        docketToDelete.docketId
      );


      closeDeleteModal();


      showToast(
        'Docket deleted successfully.',
        'success'
      );


      await loadDockets();


    } catch (error) {

      console.error(
        'Delete docket failed:',
        error
      );


      showToast(
        error.message ||
        'Could not delete docket.',
        'error'
      );


    } finally {

      confirmDeleteBtn.disabled =
        false;


      confirmDeleteBtn.textContent =
        'Delete Docket';

    }

  }
);


/* =========================================================================
   DELETE DOCKET API
   ========================================================================= */

async function deleteDocket(
  docketId
) {

  if (!docketId) {

    throw new Error(
      'Docket ID is missing.'
    );

  }


  /*
    Backend expects:

    Email
    id
  */

  const response =
    await fetch(
      CONFIG.DELETE_DOCKET_URL,
      {

        method:
          'DELETE',

        headers: {

          'Content-Type':
            'application/json',

           'Authorization':
                `Bearer ${currentUser.token}`

        },

        body:
          JSON.stringify({

            Email:
              currentUser.email,

            id:
              docketId

          })

      }
    );


  const data =
    await response
      .json()
      .catch(
        () => ({})
      );


  if (!response.ok) {

    throw new Error(
      data.message ||
      'Could not delete docket.'
    );

  }


  return data;

}


/* =========================================================================
   SAVE STATUS
   ========================================================================= */

function setSaveStatus(
  text
) {

  saveStatus.textContent =
    text;

}


/* =========================================================================
   TOAST
   ========================================================================= */

function showToast(
  message,
  type
) {

  toast.textContent =
    message;


  toast.className =
    'toast ' +
    (type || '') +
    ' show';


  clearTimeout(
    toastTimer
  );


  toastTimer =
    setTimeout(
      () => {

        toast.classList.remove(
          'show'
        );

      },
      2800
    );

}


/* =========================================================================
   DATE FORMAT
   ========================================================================= */

function formatDate(
  value
) {

  if (!value) {

    return 'recently';

  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return 'recently';

  }


  const now =
    new Date();


  const diffMs =
    now.getTime() -
    date.getTime();


  if (diffMs < 0) {

    return 'just now';

  }


  const totalSeconds =
    Math.floor(
      diffMs / 1000
    );


  const totalMinutes =
    Math.floor(
      totalSeconds / 60
    );


  const totalHours =
    Math.floor(
      totalMinutes / 60
    );


  if (totalSeconds < 60) {

    return `${totalSeconds} ${
      totalSeconds === 1
        ? 'second'
        : 'seconds'
    } ago`;

  }


  if (totalMinutes < 60) {

    return `${totalMinutes} ${
      totalMinutes === 1
        ? 'minute'
        : 'minutes'
    } ago`;

  }


  if (totalHours < 24) {

    const minutes =
      totalMinutes % 60;


    if (minutes === 0) {

      return `${totalHours} ${
        totalHours === 1
          ? 'hour'
          : 'hours'
      } ago`;

    }


    return `${totalHours} ${
      totalHours === 1
        ? 'hour'
        : 'hours'
    } ${minutes} ${
      minutes === 1
        ? 'minute'
        : 'minutes'
    } ago`;

  }


  const todayStart =
    new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );


  const dateStart =
    new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );


  const calendarDayDiff =
    Math.round(
      (
        todayStart.getTime() -
        dateStart.getTime()
      ) /
      (1000 * 60 * 60 * 24)
    );


  if (
    calendarDayDiff === 1
  ) {

    return 'yesterday';

  }


  if (
    date.getFullYear() ===
    now.getFullYear()
  ) {

    return date.toLocaleDateString(
      undefined,
      {

        day:
          'numeric',

        month:
          'short'

      }
    );

  }


  return date.toLocaleDateString(
    undefined,
    {

      day:
        'numeric',

      month:
        'short',

      year:
        'numeric'

    }
  );

}


/* =========================================================================
   LIVE DATE UPDATES
   ========================================================================= */

function startLiveDateUpdates() {

  stopLiveDateUpdates();


  updateDocketDates();


  liveDateUpdateTimer =
    setInterval(
      updateDocketDates,
      30000
    );

}


function stopLiveDateUpdates() {

  if (
    liveDateUpdateTimer !== null
  ) {

    clearInterval(
      liveDateUpdateTimer
    );


    liveDateUpdateTimer =
      null;

  }

}


function updateDocketDates() {

  const dateElements =
    document.querySelectorAll(
      '[data-updated-at]'
    );


  dateElements.forEach(
    element => {

      const timestamp =
        element.dataset.updatedAt;


      if (!timestamp) {

        return;

      }


      element.textContent =
        `Edited ${formatDate(timestamp)}`;

    }
  );

}


/* =========================================================================
   HTML / JS ESCAPING
   ========================================================================= */

function escapeHtml(
  value
) {

  return String(value)

    .replace(
      /&/g,
      '&amp;'
    )

    .replace(
      /</g,
      '&lt;'
    )

    .replace(
      />/g,
      '&gt;'
    )

    .replace(
      /"/g,
      '&quot;'
    )

    .replace(
      /'/g,
      '&#039;'
    );

}


function escapeJs(
  value
) {

  return String(value)

    .replace(
      /\\/g,
      '\\\\'
    )

    .replace(
      /'/g,
      "\\'"
    )

    .replace(
      /"/g,
      '\\"'
    )

    .replace(
      /\n/g,
      '\\n'
    )

    .replace(
      /\r/g,
      '\\r'
    );

}


/* =========================================================================
   LOGOUT
   ========================================================================= */

logoutBtn.addEventListener(
  'click',
  () => {

    stopLiveDateUpdates();


    currentUser =
      null;

    localStorage.removeItem('docket_token');

    currentDockets =
      [];


    currentEditingDocket =
      null;


    docketToDelete =
      null;


    authForm.reset();


    clearMsg();


    docketsList.innerHTML = `
      <div class="dashboard-loading">
        Loading your dockets…
      </div>
    `;


    showScreen(
      'lock'
    );

  }
);


/* =========================================================================
   MODAL CLICK OUTSIDE
   ========================================================================= */

deleteModal.addEventListener(
  'click',
  (e) => {

    if (
      e.target ===
      deleteModal
    ) {

      closeDeleteModal();

    }

  }
);


/* =========================================================================
   KEYBOARD SHORTCUT
   ========================================================================= */

document.addEventListener(
  'keydown',
  (e) => {

    /*
      Ctrl/Cmd + S
    */

    if (
      (e.ctrlKey || e.metaKey) &&
      e.key.toLowerCase() === 's' &&
      screens.editor.classList.contains('active')
    ) {

      e.preventDefault();

      saveCurrentDocket();

    }


    /*
      Escape closes delete modal.
    */

    if (
      e.key === 'Escape' &&
      deleteModal.classList.contains('active')
    ) {

      closeDeleteModal();

    }

  }
);


/* =========================================================================
   INITIAL STATE
   ========================================================================= */

setMode('login');

showScreen('lock');