const baseUrl = "https://backbone-web-api.production.twente.delcom.nl/";

function storeTokens({access_token: accessToken, id_token: idToken, refresh_token: refreshToken}) {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("idToken", idToken);
  localStorage.setItem("refreshToken", refreshToken);
}

export function getUsername() {
  const token = localStorage.getItem("idToken");
  if(!token) return null;
  else return JSON.parse(atob(token.split('.')[1])).email;
}

async function refreshJWT() {
  const refreshToken = localStorage.getItem("refreshToken");
  if(refreshToken === null) return null;
  const response = await postRequest("/auth/token-refresh", {refresh_token: refreshToken}, false);
  if(response.statusCode) return null;
  storeTokens(response);
  return response.id_token;
}

async function getToken() {
  const token = localStorage.getItem("idToken");
  const tokenIsValid = !!token && JSON.parse(atob(token.split('.')[1])).exp > (Date.now() / 1000);
  if(!tokenIsValid) {
    const newToken = await refreshJWT();
    if(newToken !== null) return newToken;
    throw new Error("No valid credentials found!");
  }
  return token;
}

export async function hasValidToken() {
  try {
    await getToken();
    return true;
  } catch(e) {
    console.log(e);
    return false;
  }
}

export async function postRequest(url, body, auth = true) {
  const headers = {"Content-Type": "application/json"};
  if(auth) headers["Authorization"] = `Bearer ${await getToken()}`;
  return (await fetch(baseUrl + url, {
    headers,
    body: JSON.stringify(body),
    method: "POST",
    credentials: "omit",
  })).json();
}

export async function getRequest(url) {
  const headers = {"Authorization": `Bearer ${await getToken()}`};
  return (await fetch(baseUrl + url, {
    headers,
    method: "GET",
    credentials: "omit",
  })).json();
}

export async function login(email, password) {
  const response = await postRequest("auth", {
    email,
    password,
  }, false);

  document.getElementById("password").value = "";
  if(response.statusCode) {
    if(response.message === "Unauthorized") throw new Error("Wrong username and/or password");
    else throw new Error(response.message);
  }

  storeTokens(response);

  return "Login sucessful!";
}
