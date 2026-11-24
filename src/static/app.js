document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupContainer = document.getElementById("signup-container");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const accountMenuButton = document.getElementById("account-menu-button");
  const accountMenu = document.getElementById("account-menu");
  const loginButton = document.getElementById("login-button");
  const logoutButton = document.getElementById("logout-button");
  const loginDialog = document.getElementById("login-dialog");
  const loginForm = document.getElementById("login-form");
  const loginMessage = document.getElementById("login-message");
  const teacherAccount = document.getElementById("teacher-account");
  const teacherName = document.getElementById("teacher-name");

  let authorization = null;

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (character) => {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };
      return entities[character];
    });
  }

  function showMessage(element, text, type) {
    element.textContent = text;
    element.className = type;
    element.classList.remove("hidden");

    setTimeout(() => {
      element.classList.add("hidden");
    }, 5000);
  }

  function updateTeacherControls(username) {
    const isTeacher = Boolean(authorization);
    loginButton.hidden = isTeacher;
    teacherAccount.hidden = !isTeacher;
    signupContainer.hidden = !isTeacher;
    teacherName.textContent = username || "";
  }

  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      activitiesList.replaceChildren();
      activitySelect.replaceChildren(new Option("-- Select an activity --", ""));

      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
                <h5>Participants:</h5>
                <ul class="participants-list">
                  ${details.participants
                    .map(
                      (email) => `<li>
                        <span class="participant-email">${escapeHTML(email)}</span>
                        ${
                          authorization
                            ? `<button class="delete-btn" data-activity="${escapeHTML(
                                name
                              )}" data-email="${escapeHTML(
                                email
                              )}" aria-label="Unregister ${escapeHTML(
                                email
                              )} from ${escapeHTML(name)}">Remove</button>`
                            : ""
                        }
                      </li>`
                    )
                    .join("")}
                </ul>
              </div>`
            : "<p><em>No participants yet</em></p>";

        activityCard.innerHTML = `
          <h4>${escapeHTML(name)}</h4>
          <p>${escapeHTML(details.description)}</p>
          <p><strong>Schedule:</strong> ${escapeHTML(details.schedule)}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">${participantsHTML}</div>
        `;

        activitiesList.appendChild(activityCard);

        const option = new Option(name, name);
        activitySelect.appendChild(option);
      });

      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.textContent =
        "Failed to load activities. Please try again later.";
      console.error("Error fetching activities:", error);
    }
  }

  async function handleUnregister(event) {
    const button = event.currentTarget;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
          headers: { Authorization: authorization },
        }
      );
      const result = await response.json();

      if (response.ok) {
        showMessage(messageDiv, result.message, "success");
        fetchActivities();
      } else {
        showMessage(messageDiv, result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage(
        messageDiv,
        "Failed to unregister. Please try again.",
        "error"
      );
      console.error("Error unregistering:", error);
    }
  }

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = activitySelect.value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
          headers: { Authorization: authorization },
        }
      );
      const result = await response.json();

      if (response.ok) {
        showMessage(messageDiv, result.message, "success");
        signupForm.reset();
        fetchActivities();
      } else {
        showMessage(messageDiv, result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage(messageDiv, "Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  loginButton.addEventListener("click", () => {
    accountMenu.hidden = true;
    accountMenuButton.setAttribute("aria-expanded", "false");
    loginMessage.classList.add("hidden");
    loginDialog.showModal();
  });

  accountMenuButton.addEventListener("click", () => {
    accountMenu.hidden = !accountMenu.hidden;
    accountMenuButton.setAttribute(
      "aria-expanded",
      String(!accountMenu.hidden)
    );
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const encodedCredentials = btoa(`${username}:${password}`);

    try {
      const response = await fetch("/auth/session", {
        headers: { Authorization: `Basic ${encodedCredentials}` },
      });
      const result = await response.json();

      if (!response.ok) {
        loginMessage.textContent = result.detail || "Login failed.";
        loginMessage.className = "error";
        return;
      }

      authorization = `Basic ${encodedCredentials}`;
      updateTeacherControls(result.username);
      loginDialog.close();
      loginForm.reset();
      fetchActivities();
    } catch (error) {
      loginMessage.textContent = "Unable to log in. Please try again.";
      loginMessage.className = "error";
      console.error("Error logging in:", error);
    }
  });

  logoutButton.addEventListener("click", () => {
    authorization = null;
    updateTeacherControls("");
    signupForm.reset();
    fetchActivities();
  });

  document.getElementById("cancel-login").addEventListener("click", () => {
    loginDialog.close();
  });

  updateTeacherControls("");
  fetchActivities();
});
