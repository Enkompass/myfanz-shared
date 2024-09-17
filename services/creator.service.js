const {
  makeAuthorizedRequest,
  getCSRFTokenFromCookie,
} = require('../helpers/helpers');

async function checkUserHasActiveStory(userId, cookie) {
  const { csrfCleanToken } = getCSRFTokenFromCookie(cookie);
  const res = await makeAuthorizedRequest(cookie, {
    url: `/creator-srv/story/has-story/${userId}`,
    method: 'get',
    headers: {
      'X-Csrf-Token': csrfCleanToken,
    },
  });

  return Boolean(res?.data);
}

async function checkUsersHasActiveStory(users, cookie) {
  const { csrfCleanToken } = getCSRFTokenFromCookie(cookie);
  const res = await makeAuthorizedRequest(cookie, {
    url: `/creator-srv/story/has-story`,
    method: 'POST',
    data: { users },
    headers: {
      'X-Csrf-Token': csrfCleanToken,
    },
  });

  return res?.data;
}

async function fetchStoryById(storyId, cookie) {
  const { csrfCleanToken } = getCSRFTokenFromCookie(cookie);
  const res = await makeAuthorizedRequest(cookie, {
    url: `/creator-srv/story/${storyId}/by-id`,
    method: 'GET',
    headers: {
      'X-Csrf-Token': csrfCleanToken,
    },
  });

  return res?.data;
}

async function fetchUserPosts(data, cookie) {
  const { csrfCleanToken } = getCSRFTokenFromCookie(cookie);
  const res = await makeAuthorizedRequest(cookie, {
    url: `/creator-srv/username/:${data.username}`,
    method: 'GET',
    data,
    headers: {
      'X-Csrf-Token': csrfCleanToken,
    },
  });

  console.log('checkUserHasActiveStory res ', res);
  return res?.data;
}

module.exports = {
  checkUserHasActiveStory,
  fetchUserPosts,
  checkUsersHasActiveStory,
  fetchStoryById,
};
