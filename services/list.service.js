const { Sequelize } = require('sequelize');
const { union } = require('lodash');

const AllModels = require('../models/index');
const {
  User,
  Lists,
  BaseLists,
  Connections,
  SubscriptionsDetails,
  CreatorSettings,
  Promotions,
} = require('../models/index');
const { NotFoundError, ConflictError } = require('../errors');
const {
  fetchUserSubscriptionBundles,
  initSubscriptionBundle,
} = require('./creatorBundles.service');
const { fetchReportedUser } = require('./report.service');
const { Op } = Sequelize;

/**
 * Fetch user lists included refUser
 * @param userId {number} - user id (lists owner)
 * @param refUserId {number} - ref user id (included in lists)
 * @param active {boolean} [active=true] - active flag
 * @returns {Promise<Model[]>}
 */
async function fetchUsersListsIncludedUser(userId, refUserId, active = true) {
  return Lists.findAll({
    where: { userId, type: { [Op.ne]: 'followers' } },
    attributes: ['id', 'name', 'type'],
    include: {
      model: Connections,
      as: 'connections',
      attributes: [],
      where: {
        userId: refUserId,
        expiredAt: { [Op[active ? 'is' : 'ne']]: null },
      },
      required: true,
    },
    // group: [Lists.id],
  });
}

/**
 * Fetch user list by list type
 * @param userId {number} - user id
 * @param type {string} - list type
 * @param raw {boolean} - row flag
 * @returns {Promise<Model>}
 */
async function fetchUserListByType(userId, type, raw = true) {
  return Lists.findOne({ where: { userId, type }, raw });
}

/**
 * Fetch users connection by list type
 * @param userId {number} - user id (list owner)
 * @param type {string} - list type
 * @param refUserId {number} - ref user id (user in connection)
 * @param active {boolean} [active=false] - active flag
 * @returns {Promise<Model>}
 */
async function checkUsersConnectionByList(
  userId,
  type,
  refUserId,
  active = true
) {
  return Lists.findOne({
    where: { userId, type },
    include: {
      model: Connections,
      as: 'connections',
      attributes: ['userId'],
      where: {
        userId: refUserId,
        expiredAt: { [Op[active ? 'is' : 'ne']]: null },
      },
      required: true,
    },
    // group: [Lists.id],
  });
}

/**
 * Fetch base list by type
 * @param type {string} - list type
 * @param raw {boolean} [raw=true] - raw flag
 * @returns {Promise<Model>}
 */
async function fetchBaseListByType(type, raw = true) {
  return BaseLists.findOne({ where: { type }, raw });
}

/**
 * Fetch all users in connection by list type
 * @param userId
 * @param slug
 * @param active {boolean} [active=false] - active flag
 * @returns {Promise<any>}
 */
async function fetchUsersInConnection(userId, slug, active = true) {
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
        where: {
          expiredAt: { [Op[active ? 'is' : 'ne']]: null },
        },
      },
    ],
  });

  if (!list)
    return {
      users: [],
      totalConnections: 0,
    };

  list = list.dataValues;
  let connections = list.connections;

  list.users = [];

  for (let j = 0; j < connections.length; j++) {
    let connection = connections[j].dataValues;
    list.users.push(connection.userId);
  }

  delete list.connections;
  list.totalConnections = connections.length;
  return list;
}

/**
 * Fetch users active subscription
 * @param userId {number} - user id subscriber
 * @param toUserId {number} - user id to subscribe
 * @returns {Promise<any>}
 */
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

/**
 * Check is user expired follower
 * @param userId {number} - Main user id
 * @param validateForUser {number} - User id need to check
 * @returns {Promise<boolean>}
 */
async function checkIsExpiredFollower(userId, validateForUser) {
  // const listFollowing = await fetchUserListByType(userId, 'following', true);
  const listFollowers = await fetchUserListByType(userId, 'followers', true);

  return Boolean(
    await User.scope('withId').findOne({
      attributes: ['id'],
      where: {
        id: {
          [Op.and]: [
            { [Op.eq]: validateForUser },
            // { [Op.notIn]: notAllowedUsers },
            {
              [Op.notIn]: Sequelize.literal(
                `(SELECT "userId" FROM "Connections" WHERE "listId" = ${listFollowers.id} AND "expiredAt" IS NULL)`
              ),
            },
            {
              [Op.in]: Sequelize.literal(
                `(SELECT "userId" FROM "Connections" WHERE "listId" = ${listFollowers.id} AND "expiredAt" IS NOT NULL)`
              ),
            },
          ],
        },
      },
      raw: true,
    })
  );
}

/**
 * Check if passed trial promotion already used for user
 * @param userId {number} - Main user id
 * @param validateForUser {number} - User id need to check
 * @param promotionId {number} - Trial promotion id
 * @returns {Promise<boolean>}
 */
async function checkIsUsedTrialPromotion(userId, validateForUser, promotionId) {
  return Boolean(
    await User.scope('withId').findOne({
      attributes: ['id'],
      where: {
        id: {
          [Op.and]: [
            { [Op.eq]: userId },
            {
              [Op.in]: Sequelize.literal(
                `(SELECT c."userId" 
                FROM "Lists" l
                INNER JOIN "Connections" c ON c."listId" = l.id
                INNER JOIN "SubscriptionsDetails" s on s."connectionId" = c.id 
                WHERE l."userId" = ${validateForUser} AND l."type" = 'following' AND s.type = 'trial' AND s."planId" = ${promotionId}
                )
                `
              ),
            },
          ],
        },
      },
      raw: true,
    })
  );
}

/**
 * Fetch user active subscription to users
 * @param userId {number} - user id subscriber
 * @param toUsers {Array<number>} - user ides to subscribe
 * @returns {Promise<Model[]>}
 */
async function fetchActiveSubscriptions(userId, toUsers) {
  return await Connections.findAll({
    where: { userId: { [Op.in]: toUsers }, expiredAt: { [Op.is]: null } },
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
        // where: { expiredAt: { [Op.is]: null } },
        required: true,
      },
    ],
    raw: true,
  });
}

/**
 * Return users active subscription existing flag
 * @param userId {number} - user id subscriber
 * @param toUserId {number} - user id to subscribe
 * @returns {Promise<boolean>}
 */
async function checkActiveSubscription(userId, toUserId) {
  const activeSubscription = await Connections.findOne({
    where: { userId: toUserId, expiredAt: { [Op.is]: null } },
    include: [
      {
        model: Lists,
        as: 'list',
        where: { userId, type: 'following' },
        required: true,
      },
    ],
    raw: true,
  });

  return !!activeSubscription;
}

/**
 * Fetch users active subscription details
 * @param userId {number} - user id subscriber
 * @param refUserId {number} - user id to subscribe
 * @returns {Promise<{subscribed: boolean, currentSubscriptionPrice: number, subscribedAt: (string|boolean|null), subscriptionExpireAt: null}>}
 */
async function getUsersSubscriptionsDetails(userId, refUserId) {
  const activeSubscription =
    (await fetchActiveSubscription(userId, refUserId)) || {};

  return {
    subscribed: !!activeSubscription.id,
    currentSubscriptionPrice:
      activeSubscription['subscriptionDetails.price'] || 0,
    subscriptionExpireAt:
      activeSubscription['subscriptionDetails.expireAt'] || null,
    subscribedAt: activeSubscription['createdAt'] || null,
  };
}

/**
 * Get user subscription planes
 * @param userId {number} - user id
 * @param validateForUser {number | undefined} - Validate user id
 * @returns {Promise<any>}
 */
async function getUserSubscriptionPlanes(userId, validateForUser) {
  const settings = await CreatorSettings.findOne({
    where: { userId: Number(userId) },
    raw: true,
  });

  const subscriptionBundles = await fetchUserSubscriptionBundles(userId);

  if (!settings) return {};

  return {
    subscriptionPrice: settings.subscriptionPrice,
    allowFreeSubscription: settings.allowFreeSubscription,
    subscriptionBundles: subscriptionBundles?.map((bundle) =>
      initSubscriptionBundle(bundle, settings.subscriptionPrice)
    ),
    promotions: await fetchUserPromotions(userId, validateForUser),
  };
}

/**
 * Fetch user promotions
 * @param userId {number} - User id
 * @param validateForUser {number | null} - User id for validate
 * @param expectFinished {boolean} [expectFinished=true] - If passed true get only not finished promotions, otherwise get all promotions
 * @param link {boolean} [link=false] - If passed true get only free trial links, otherwise get all without trial links
 * @param additionalFilter {Object | null} [additionalFilter=null] - If passed then add to fetch promotions filter
 * @returns {Promise<Model[]>}
 */
async function fetchUserPromotions(
  userId,
  validateForUser,
  expectFinished = true,
  link = false,
  additionalFilter = null
) {
  let filter = {
    userId,
    link,
  };

  if (expectFinished) {
    filter.finishAt = {
      [Op.or]: [{ [Op.is]: null }, { [Op.gt]: new Date() }],
    };
  }

  if (additionalFilter) {
    filter = { ...filter, ...additionalFilter };
  }

  const promotions = await Promotions.findAll({ where: filter, raw: true });

  if (!promotions?.length) return [];

  if (validateForUser) {
    return validatePromotions(promotions, validateForUser);
  } else return promotions;
}

/**
 * Validate passed promotions for user
 * @param promotions {Array<Object>} - Promotions list
 * @param validateForUser {number | undefined} - User id for validate
 * @param error {boolean} [error = false] - If true and cannot claim to throw an error
 * @returns {Promise<{length}|*>}
 */
async function validatePromotions(promotions, validateForUser, error = false) {
  if (promotions?.length) {
    for (let index = 0; index < promotions.length; index++) {
      promotions[index] = await validateOnePromotion(
        promotions[index],
        validateForUser,
        error
      );
    }
  }

  return promotions;
}

/**
 * Validate passed promotion for user
 * @param promotion {Object} - Promotions list
 * @param validateForUser {number | undefined} - User id for validate
 * @param error {boolean} [error = false] - If true and cannot claim to throw an error
 * @returns {Promise<{length}|*>}
 */
async function validateOnePromotion(promotion, validateForUser, error = false) {
  promotion.canClaim = true;

  if (promotion.finishAt && new Date(promotion.finishAt) < new Date()) {
    if (error) throw new ConflictError('Promotion is not active');
    else {
      promotion.canClaim = false;
      return promotion;
    }
  }

  if (
    promotion.subscribeCount &&
    promotion.claimsCount >= promotion.subscribeCount
  ) {
    if (error) throw new ConflictError('Promotion subscribers limit reached');
    else {
      promotion.canClaim = false;
      return promotion;
    }
  }

  if (validateForUser) {
    if (validateForUser === promotion.userId) {
      if (error) throw new ConflictError('Own promotion');
      else {
        promotion.canClaim = false;
        return promotion;
      }
    }

    if (
      promotion.type === 'trial' &&
      (await checkIsUsedTrialPromotion(
        promotion.userId,
        validateForUser,
        promotion.id
      ))
    ) {
      if (error)
        throw new ConflictError(
          "This free trial offer doesn't exist anymore because it was claimed"
        );
      else {
        promotion.canClaim = false;
        return promotion;
      }
    }

    const subscribed = await checkActiveSubscription(
      validateForUser,
      promotion.userId
    );

    if (subscribed) {
      if (error) throw new ConflictError('Already subscribed to this user');
      else {
        promotion.canClaim = false;
        return promotion;
      }
    }

    if (promotion.group === 'all') return promotion;

    const isExpiredFollower = await checkIsExpiredFollower(
      promotion.userId,
      validateForUser
    );

    if (promotion.group === 'expired' && !isExpiredFollower) {
      if (error) throw new ConflictError('Only for expired users');
      else {
        promotion.canClaim = false;
        return promotion;
      }
    } else if (promotion.group === 'new' && isExpiredFollower) {
      if (error) throw new ConflictError('Only for new subscribers');
      else {
        promotion.canClaim = false;
        return promotion;
      }
    }
  }

  return promotion;
}

/**
 * Validate users blocking
 * @param userId {number} - user id
 * @param refUserId {number} - ref user id
 * @param validateRestricted {boolean} [validateRestricted=false] - if passed true validate also restricted
 * @returns {Promise<void>}
 */
async function validateBlocking(userId, refUserId, validateRestricted = false) {
  const refUser = await User.findOne({
    where: { id: refUserId },
    raw: true,
    ignoreHook: true,
    attributes: ['active'],
  });

  if (!refUser) throw new ConflictError('User not exists');
  if (!refUser.active) throw new ConflictError('Deactivated user');

  if (await checkUsersConnectionByList(userId, 'blocked', refUserId))
    throw new ConflictError('Blocked user');

  if (await checkUsersConnectionByList(refUserId, 'blocked', userId))
    throw new ConflictError('You are blocked by this user');

  if (validateRestricted) {
    if (await checkUsersConnectionByList(userId, 'restricted', refUserId))
      throw new ConflictError('Restricted user');

    if (await checkUsersConnectionByList(refUserId, 'restricted', userId))
      throw new ConflictError('You are restricted by this user');
  }
}

/**
 * Get all validation connections details with two users
 * @param userId {number} - user id
 * @param validateFor {number} - validate for user id
 * @returns {Promise<void>}
 */
async function fetchUsersConnectionsDetails(userId, validateFor) {
  const result = {
    ...(await getUsersSubscriptionsDetails(validateFor, userId)),
  };
  result.blocked = Boolean(
    await checkUsersConnectionByList(validateFor, 'blocked', userId)
  );
  result.blockedReversal = Boolean(
    await checkUsersConnectionByList(userId, 'blocked', validateFor)
  );

  result.restricted = Boolean(
    await checkUsersConnectionByList(validateFor, 'restricted', userId)
  );

  result.restrictedReversal = Boolean(
    await checkUsersConnectionByList(userId, 'restricted', validateFor)
  );

  result.reported = Boolean(await fetchReportedUser(validateFor, userId));

  return result;
}

/**
 * Fetch unique users id-es which blocked by passed user or they blocked passed user
 * @param userId {number} - for user id
 * @param includeRestricted {boolean} [includeRestricted=false] - restricted flag,
 * if passed false in response will add also users which restricted passed user
 * @param excludeBlockedReversal {boolean} [excludeBlockedReversal=false] - exclude blocked reversal flag,
 * if passed true in response will exclude users which blocked user
 * @returns {Promise<any>}
 */
async function fetchNotAllowedUsers(
  userId,
  includeRestricted = false,
  excludeBlockedReversal = false
) {
  const expectedListTypes = ['blocked'];

  if (includeRestricted) {
    expectedListTypes.push('restricted');
  }

  let blockedUsers = (
    await Connections.findAll({
      attributes: ['userId'],
      include: [
        {
          attributes: [],
          model: Lists,
          as: 'list',
          where: { userId, type: { [Op.in]: expectedListTypes } },
          required: true,
        },
      ],
      raw: true,
    })
  ).map((el) => el.userId);

  if (!excludeBlockedReversal) {
    const blockedFromUsers = (
      await Lists.findAll({
        attributes: ['Lists.userId'],
        where: { type: { [Op.in]: expectedListTypes } },
        include: [
          {
            attributes: [],
            model: Connections,
            as: 'connection',
            where: { userId },
            required: true,
          },
        ],
        raw: true,
        group: ['Lists.userId'],
      })
    ).map((el) => el.userId);

    return union(blockedUsers, blockedFromUsers) || [];
  }

  return blockedUsers || [];
}

/**
 * Fetch data from Lists table by filter
 * @param modelName {'BaseLists'|'Connections'|'CreatorSettings'|'Lists'|'LoginSession'|'Referrals'|'ReportedUsers'|'Role'|'SubscriptionBundles'|'SubscriptionsDetails'|'User'|'UserDetails'|'UserSettings'} - model name
 * @param filter {object} - pg filter query
 * @param onlyOne {boolean} [onlyOne=false] - if true then run findOne, otherwise findAll
 * @returns {Promise<any>}
 */
async function fetchDataFromModelByFilter(modelName, filter, onlyOne = false) {
  return AllModels?.[modelName]?.[onlyOne ? 'findOne' : 'findAll']({
    where: filter,
    raw: true,
  });
}

/**
 * Fetch all unique user ids from lists
 * @param lists {Array<number>} - Array of list id
 * @param active {boolean} [active=true] - Active flag, if true return only active connections in lists, otherwise - all
 * @param raw {boolean} [raw=true] - Raw flag
 * @returns {Promise<Model[]>}
 */
async function fetchListsAllUsers(lists, active = true, raw = true) {
  return await Connections.findAll({
    where: {
      listId: { [Op.in]: lists },
      expiredAt: { [Op[active ? 'is' : 'ne']]: null },
    },
    attributes: ['userId'],
    group: ['userId'],
    raw,
  });
}

/**
 * Fetch list by connections by list id-es , user id which included ref user
 * @param userId {number} - user id
 * @param lists {Array<number>} - list id-es
 * @param refUserId {number} - ref user id
 * @returns {Promise<Model>}
 */
async function checkUsersConnectionByLists(userId, lists, refUserId) {
  return Lists.findOne({
    where: { userId, id: { [Op.in]: lists } },
    include: {
      model: Connections,
      as: 'connections',
      attributes: ['userId'],
      where: { userId: refUserId, expiredAt: { [Op.is]: null } },
      required: true,
    },
  });
}

module.exports = {
  fetchUsersListsIncludedUser,
  fetchUserListByType,
  fetchActiveSubscription,
  fetchActiveSubscriptions,
  checkActiveSubscription,
  fetchNotAllowedUsers,
  fetchUsersConnectionsDetails,
  // checkUsersConnectionByListType,
  // fetchUserList,
  checkUsersConnectionByList,
  fetchBaseListByType,
  fetchUsersInConnection,
  getUsersSubscriptionsDetails,
  getUserSubscriptionPlanes,
  validateBlocking,
  fetchDataFromModelByFilter,
  fetchListsAllUsers,
  checkUsersConnectionByLists,
  checkIsExpiredFollower,
  validatePromotions,
  validateOnePromotion,
  checkIsUsedTrialPromotion,
  fetchUserPromotions,
};
