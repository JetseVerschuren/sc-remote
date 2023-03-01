import { get, getMany, setMany } from './idb-keyval.js';

const baseUrl = "https://backbone-web-api.production.twente.delcom.nl/";

async function storeTokens({access_token: accessToken, id_token: idToken, refresh_token: refreshToken}) {
  await setMany([
    ["accessToken", accessToken],
    ["idToken", idToken],
    ["refreshToken", refreshToken],
  ]);
}

async function storeCredentials(username, password) {
  await setMany([
    ["username", username],
    ["password", password],
  ]);
}

async function getIdToken() {
  return await get("idToken");
}

async function getRefreshToken() {
  return await get("refreshToken");
}

async function getCredentials() {
  return await getMany(["username", "password"]);
}

export async function getUsername() {
  return await get("username");
}

async function refreshJWT() {
  const refreshToken = await getRefreshToken();
  if(!refreshToken) return null;
  const response = await postRequest("/auth/token-refresh", {refresh_token: refreshToken}, false);
  if(response.statusCode) return null;
  await storeTokens(response);
  return response.id_token;
}

async function refreshUsingPassword() {
  const [username, password] = await getCredentials();

  if(!username || !password) return null;

  try {
    await login(username, password);
    return await getIdToken();
  } catch(e) {
    console.log(e);
    return null;
  }
}

async function getToken() {
  const token = await getIdToken();
  const tokenIsValid = !!token && JSON.parse(atob(token.split('.')[1])).exp > (Date.now() / 1000);
  if(!tokenIsValid) {
    const refreshedToken = await refreshJWT();
    if(refreshedToken !== null) return refreshedToken;
    const passwordToken = await refreshUsingPassword();
    if(passwordToken !== null) return passwordToken;
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

  if(response.statusCode) {
    if(response.message === "Unauthorized") throw new Error("Wrong username and/or password");
    else throw new Error(response.message);
  }

  await storeTokens(response);
  await storeCredentials(email, password);

  return "Login sucessful!";
}
