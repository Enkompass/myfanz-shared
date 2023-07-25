const {
  User,
  Lists,
  BaseLists,
  Connections,
  SubscriptionsDetails,
  CreatorSettings,
} = require('../models/index');
const { Sequelize } = require('sequelize');
const { NotFoundError } = require('../errors');
const { getObjectSignedUrl } = require('myfanz-media/s3/awsClientS3');
const {
  fetchUserSubscriptionBundles,
  initSubscriptionBundle,
} = require('./creatorBundles.service');
const { Op } = Sequelize;

async function fetchUsersListsIncludedUser(userId, refUserId) {
  return Lists.findAll({
    where: { userId, type: { [Op.ne]: 'followers' } },
    attributes: ['id', 'name', 'type'],
    include: {
      model: Connections,
      as: 'connections',
      attributes: [],
      where: { userId: refUserId },
      required: true,
    },
    // group: [Lists.id],
  });
}

async function fetchUserListByType(userId, type, raw = true) {
  return Lists.findOne({ where: { userId, type }, raw });
}

async function checkUsersConnectionByListType(userId, type, refUserId) {
  return Lists.findOne({
    where: { userId, type },
    include: {
      model: Connections,
      as: 'connections',
      attributes: ['userId'],
      where: { userId: refUserId },
      required: true,
    },
    // group: [Lists.id],
  });
}

async function checkUsersConnectionByList(userId, type, refUserId) {
  return Lists.findOne({
    where: { userId, type },
    include: {
      model: Connections,
      as: 'connections',
      attributes: ['userId'],
      where: { userId: refUserId },
      required: true,
    },
    // group: [Lists.id],
  });
}

async function fetchBaseListByType(type, raw = true) {
  return BaseLists.findOne({ where: { type }, raw });
}

async function fetchUserList(userId, slug) {
  const where = { userId };

  if (!isNaN(Number(slug))) {
    where.id = slug;
  } else if (typeof slug === 'string' && (await fetchBaseListByType(slug)))
    where.type = slug;
  else throw new NotFoundError('List not found');

  let list = await Lists.findOne({
    // raw: true,
    where,
    include: [
      {
        model: Connections,
        as: 'connections',
        attributes: ['userId'],
        include: {
          hooks: true,
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'displayName', 'avatar', 'cover'],
        },
      },
      // { model: BaseLists, as: 'basicLists' /*attributes: ['id']*/ },
    ],
  });

  list = list.dataValues;
  let connections = list.connections;

  console.log('connections ', connections);

  for (let j = 0; j < connections.length; j++) {
    let connection = connections[j].dataValues;
    const user = connection.user.dataValues;
    connection = { ...connection, ...user };
    if (user.avatar) {
      connection.avatar = await getObjectSignedUrl(user.avatar);
    } else connection.avatar = null;

    if (user.cover) {
      connection.cover = await getObjectSignedUrl(user.cover);
    } else connection.cover = null;

    connection.subscribed = Boolean(
      await checkUsersConnectionByList(userId, 'following', user.id)
    );

    connection.lists = await fetchUsersListsIncludedUser(userId, user.id);

    delete connection.user;
    connections[j] = connection;
  }

  list.connections = connections;
  list.totalConnections = connections.length;
  return list;
}

async function fetchUsersInConnection(userId, slug) {
  const where = { userId };

  if (!isNaN(Number(slug))) {
    where.id = slug;
  } else if (typeof slug === 'string' && (await fetchBaseListByType(slug)))
    where.type = slug;
  else throw new NotFoundError('List not found');

  let list = await Lists.findOne({
    // raw: true,
    where,
    include: [
      {
        model: Connections,
        as: 'connections',
        attributes: ['userId'],
      },
    ],
  });

  list = list.dataValues;
  let connections = list.connections;

  console.log('connections ', connections);

  list.users = [];

  for (let j = 0; j < connections.length; j++) {
    let connection = connections[j].dataValues;
    list.users.push(connection.userId);
  }

  delete list.connections;
  list.totalConnections = connections.length;
  return list;
}

async function fetchActiveSubscription(userId, toUserId) {
  return await Connections.findOne({
    where: { userId: toUserId, expiredAt: { [Op.is]: null } },
    include: [
      {
        model: Lists,
        as: 'list',
        where: { userId, type: 'following' },
        required: true,
      },
      {
        model: SubscriptionsDetails,
        as: 'subscriptionDetails',
        where: { expiredAt: { [Op.is]: null } },
        required: true,
      },
      {
        hooks: true,
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'displayName', 'avatar', 'cover'],
      },
    ],
    raw: true,
  });
}

async function getUsersSubscriptionsDetails(userId, refUserId) {
  const activeSubscription =
    (await fetchActiveSubscription(userId, refUserId)) || {};

  console.log('activeSubscription ', activeSubscription);

  return {
    subscribed: !!activeSubscription.id,
    currentSubscriptionPrice:
      activeSubscription['subscriptionDetails.price'] || 0,
    subscriptionExpireAt:
      activeSubscription['subscriptionDetails.expireAt'] || null,
    subscribedAt: activeSubscription['createdAt'] || null,
  };
}

async function getUserSubscriptionPlanes(userId) {
  const settings = await CreatorSettings.findOne({
    where: { userId: Number(userId) },
    raw: true,
  });

  const subscriptionBundles = await fetchUserSubscriptionBundles(userId);

  console.log('subscriptionBundles ', subscriptionBundles);
  console.log('settings ', settings);
  // console.log('subscriptions ', subscriptions);

  if (!settings) return {};

  return {
    subscriptionPrice: settings.subscriptionPrice,
    allowFreeSubscription: settings.allowFreeSubscription,
    subscriptionBundles: subscriptionBundles?.map((bundle) =>
      initSubscriptionBundle(bundle, settings.subscriptionPrice)
    ),
  };
}

module.exports = {
  fetchUsersListsIncludedUser,
  fetchUserListByType,
  checkUsersConnectionByListType,
  fetchUserList,
  checkUsersConnectionByList,
  fetchBaseListByType,
  fetchUsersInConnection,
  getUsersSubscriptionsDetails,
  getUserSubscriptionPlanes,
};
