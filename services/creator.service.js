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

module.exports = {
  checkUserHasActiveStory,
  checkUsersHasActiveStory,
};
