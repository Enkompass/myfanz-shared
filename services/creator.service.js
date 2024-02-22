const { makeAuthorizedRequest } = require('../helpers/helpers');

async function checkUserHasActiveStory(userId, cookie) {
  const res = await makeAuthorizedRequest(cookie, {
    url: `/creator-srv/story/has-story/${userId}`,
    method: 'get',
  });

  return Boolean(res?.data);
}

async function checkUsersHasActiveStory(users, cookie) {
  const res = await makeAuthorizedRequest(cookie, {
    url: `/creator-srv/story/has-story`,
    method: 'POST',
    data: { users },
  });

  return res?.data;
}

async function fetchStoryById(storyId, cookie) {
  const res = await makeAuthorizedRequest(cookie, {
    url: `/creator-srv/story/${storyId}/by-id`,
    method: 'GET',
  });

  return res?.data;
}

module.exports = {
  checkUserHasActiveStory,
  checkUsersHasActiveStory,
  fetchStoryById,
};
