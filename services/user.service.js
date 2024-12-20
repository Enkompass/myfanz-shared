const axios = require('axios');
const { Sequelize } = require('sequelize');
const { eachOfLimit } = require('async');

const {
  sequelize,
  User,
  UserDetails,
  UserSettings,
  CreatorSettings,
  SubscriptionBundles,
  Referrals,
  Connections,
  Lists,
  StripeDetails,
  CardAccounts,
  CreatorsCouples,
  Promotions,
  SubAdminPermissions,
} = require('../models/index');
const {
  fetchUsersConnectionsDetails,
  fetchActiveSubscriptions,
  validatePromotions,
} = require('./list.service');
const { ConflictError } = require('../errors');
const { checkUsersHasActiveStory } = require('./creator.service');
const {
  checkIsCreator,
  getRoleFromId,
  getCSRFTokenFromCookie,
} = require('../helpers/helpers');

const { Op } = Sequelize;

/**
 * Get user by id
 * @param id {number} - user id to get
 * @param ignoreHook {boolean} [ignoreHook=false] - if true hooks not affected (does not get avatar and cover images)
 * @param validateFor {number|undefined} [validateFor=undefined] - if passed validated users connections
 * @param attributes {Array<'displayName'|'email'|'username'|'emailVerifiedAt'|'roleId'|'hasCard'|'lastActivity'|'active'|'avatar'|'cover'>} [attributes=undefined] - list of fields need to get, if not passed get all fields
 * @param getAvatar {boolean} [getAvatar=true] - get avatar
 * @param getCover {boolean} [getCover=true] - get cover
 * @param getSmallCover {boolean} [getSmallCover=false] - get small cover
 * @returns {Promise<Model>}
 */
async function getUserById(
  id,
  ignoreHook = false,
  validateFor = undefined,
  attributes = undefined,
  getAvatar = true,
  getCover = true,
  getSmallCover = false
) {
  let user = await User.scope('withId').findOne({
    attributes,
    where: { id },
    ignoreHook,
    getAvatar,
    getCover,
    getSmallCover,
    raw: true,
  });

  if (!user) return null;

  if (user.lastActivity) {
    const userSettings = await UserSettings.findOne({
      where: { userId: id },
      raw: true,
    });
    if (!userSettings?.showActivityStatus) user.lastActivity = null;
  }
  if (validateFor) {
    user = {
      ...user,
      ...(await fetchUsersConnectionsDetails(id, validateFor)),
    };
  }

  return user;
}

/**
 * Get user by filter
 * @param filter {object} - filter to get user
 * @param ignoreHook {boolean} [ignoreHook=false] - if true hooks not affected (does not get avatar and cover images)
 * @param validateFor {number|undefined} [validateFor=undefined] - if passed validated users connections
 * @param getAvatar {boolean} [getAvatar=true] - get avatar
 * @param getCover {boolean} [getCover=true] - get cover
 * @param getSmallCover {boolean} [getSmallCover=false] - get small cover
 * @returns {Promise<Model>}
 */
async function getUserByFilter(
  filter,
  ignoreHook = false,
  validateFor = undefined,
  getAvatar = true,
  getCover = true,
  getSmallCover = false
) {
  let user = await User.scope('withId').findOne({
    where: filter,
    ignoreHook,
    getAvatar,
    getCover,
    getSmallCover,
    raw: true,
  });
  if (!user) return null;

  if (user.lastActivity) {
    const userSettings = await UserSettings.findOne({
      where: { userId: user.id },
      raw: true,
    });
    if (!userSettings?.showActivityStatus) user.lastActivity = null;
  }

  if (validateFor) {
    user = {
      ...user,
      ...(await fetchUsersConnectionsDetails(user.id, validateFor)),
    };
  }

  return user;
}

/**
 * Get users id -es by filter
 * @param filter {object} - filter to get user
 * @returns {Promise<any>}
 */
async function getUsersIdsByFilter(filter) {
  const users =
    (await User.scope('withId').findAll({
      attributes: ['id'],
      where: filter,
      ignoreHook: true,
      raw: true,
    })) || [];

  return users.map((el) => el.id);
}

async function getUsersDataByIds(userIds) {
  return User.scope('withId').findAll({
    where: { id: { [Op.in]: userIds } },
    // include: [{ model: UserDetails, attributes: ['location'] }],
    raw: true,
  });
}

async function getUserAllData(
  userId,
  ignoreHook = false,
  getAvatar = true,
  getCover = true,
  getSmallCover = false
) {
  return User.scope('withId').findOne({
    where: { id: userId },
    include: [{ model: UserDetails, as: 'details' }],
    raw: true,
    ignoreHook,
    getAvatar,
    getCover,
    getSmallCover,
  });
}

async function getUserDetails(userId) {
  return UserDetails.findOne({ where: { userId }, raw: true });
}

/**
 * Fetch user data with filter
 * @param filter
 * @returns {Promise<any>}
 */
async function fetchUserDataByFilter(filter) {
  return User.scope('withId').findOne({ where: filter, raw: true });
}

/**
 * Make report by request to main api service
 * @param cookie - session cookie
 * @param reportedUser -  reported user id
 * @param typeId - report type
 * @param message - report message
 * @param itemType - reported item type
 * @param itemId - reported item id
 * @param itemUrl - reported item URL
 * @returns {Promise<(*&{success: boolean})|*|{success: boolean, message: string}>}
 */
async function makeReport(
  cookie,
  reportedUser,
  typeId,
  message,
  itemType,
  itemId,
  itemUrl
) {
  try {
    const mainAppUrl = process.env.APP_API_URL;
    if (!mainAppUrl)
      return {
        success: false,
        message: 'Main app URL not defined',
      };

    const { csrfCleanToken } = getCSRFTokenFromCookie(cookie);
    const response = await axios({
      method: 'post',
      url: `${mainAppUrl}/report`,
      headers: {
        Cookie: cookie, // Pass the active cookie session from the incoming request
        'is-internal': true,
        'X-Csrf-Token': csrfCleanToken,
      },
      data: {
        reportedUser,
        typeId,
        message,
        itemType,
        itemId,
        itemUrl,
      },
    });

    return response.data;
  } catch (e) {
    console.log('makeReport err => ', e.response.data);
    return { success: false, ...e.response.data };
  }
}

/**
 * Get user settings
 * @param userId
 * @returns {Promise<any>}
 */
async function getUserSettings(userId) {
  return UserSettings.findOne({
    where: {
      userId,
    },
    raw: true,
  });
}

/**
 * Get user referral
 * @param userId
 * @returns {Promise<any>}
 */
async function getUserReferral(userId) {
  return Referrals.findOne({
    where: {
      userId,
    },
    raw: true,
  });
}

/**
 * Get user data by username, returns null if not found
 * @param username {string} - username of user
 * @param scope {'defaultScope'/'withPassword'/'withId'/'withAll'} [scope='defaultScope'] - scope
 * @param raw {boolean} [raw=true] - raw
 * @param ignoreHook {boolean} [ignoreHook=false] - ignoreHook
 * @param getAvatar {boolean} [getAvatar=true] - get avatar
 * @param getCover {boolean} [getCover=true] - get cover
 * @param getSmallCover {boolean} [getSmallCover=false] - get small cover
 * @returns {Promise<any|null>}
 */
async function getUserByUsername(
  username,
  scope = 'defaultScope',
  raw = true,
  ignoreHook = false,
  getAvatar = true,
  getCover = true,
  getSmallCover = false
) {
  const user = await User.scope(scope).findOne({
    where: { username },
    raw,
    ignoreHook,
    getAvatar,
    getCover,
    getSmallCover,
  });

  if (user && user.id && user.lastActivity) {
    const userSettings = await UserSettings.findOne({
      where: { userId: user.id },
      raw: true,
    });

    if (!userSettings?.showActivityStatus) user.lastActivity = null;

    return user;
  }

  return null;
}

/**
 * TODO, Temp function , need to remove after payment service db correction
 * @returns {Promise<Model[]>}
 */
async function fetchUsersStripeDetails(filter = {}) {
  return StripeDetails.findAll({ where: filter, raw: true });
}

/**
 * TODO, Temp function , need to remove after payment service db correction
 * @returns {Promise<Model[]>}
 */
async function fetchUsersCardAccounts(filter = {}) {
  return CardAccounts.findAll({ where: filter, raw: true });
}

/**
 * TODO, Temp function , need to remove after payment service db correction
 * @returns {Promise<Model[]>}
 */
async function addUsersCardAccounts(data) {
  return CardAccounts.create(data);
}

/**
 * Fetch users detailed information by options, return also validations result by validationOptions if validateForUser passed
 * @param users {Array<number>|number} - User ides need to get, or one user id
 * @param validateForUser {number|null} [validateForUser=null] - Validate for user id
 * @param attributes {Array<'id'|'displayName'|'email'|'username'|'emailVerifiedAt'|'roleId'|'hasCard'|'lastActivity'|'deletedAt'|'active'|'avatar'|'cover'|any>} [attributes=undefined] - list of fields need to get, if not passed get all fields
 * @param photoOptions {{ignoreHooks?: boolean,getAvatar?:boolean,getCover?:boolean,getSmallCover?:boolean}}
 * @param getOptions {{roleName?: boolean,activeSubscription?: boolean,subscriptionPlanes?: boolean,hasStory?:true,listsIncludedUser?:boolean,keepFormatForOneUser?:boolean, getSecondAccount?: boolean,getDataInArray?:boolean,getFriendsList?:boolean}}
 * @param validationOptions {{subscribed?: boolean,blocked?: boolean, blockedReversal?: boolean, restricted?: boolean,restrictedReversal?: boolean,reported?:boolean,isFriend?:boolean}}
 * @param cookie {string|undefined} - [cookie=undefined] - Session cookie, required for external requests, for example for get hasStory
 * @returns {Promise<any>}
 */
async function fetchUsersData(
  users,
  validateForUser = null,
  attributes = [],
  photoOptions = {},
  getOptions = {},
  validationOptions = {},
  cookie = undefined
) {
  const result = getOptions.getDataInArray ? [] : {};
  if (!photoOptions) photoOptions = {};
  let oneUserId;
  if (!Array.isArray(users)) {
    oneUserId = Number(users);
    if (isNaN(oneUserId))
      throw new ConflictError(
        `Invalid value for 'users', must by array of user id-es or one user id `
      );

    users = [oneUserId];
  }

  if (!attributes || !attributes.length)
    attributes = [
      'id',
      'displayName',
      'email',
      'username',
      'emailVerifiedAt',
      'roleId',
      'hasCard',
      'lastActivity',
      'deletedAt',
      'active',
      'avatar',
      'cover',
    ];

  if (getOptions.roleName) {
    attributes.push([
      sequelize.literal(`(
                    SELECT name
                    FROM "Roles" 
                    WHERE "id" = "User"."roleId"
                )`),
      'role',
    ]);
  }

  let include = [];
  let activeSubscriptions = [];
  let activeStories = {};
  let listsIncludedUser = {};

  if (attributes.includes('lastActivity')) {
    include.push({
      attributes: ['showActivityStatus'],
      model: UserSettings,
      as: 'UserSettings',
      raw: true,
    });

    attributes = attributes.filter((el) => el !== 'lastActivity');

    attributes.push([
      sequelize.literal(`(
                    CASE WHEN "UserSettings"."showActivityStatus" = true THEN "User"."lastActivity" ELSE NULL END
                )`),
      'lastActivity',
    ]);
  }

  if (getOptions.subscriptionPlanes) {
    include.push(
      {
        attributes: ['subscriptionPrice'],
        model: CreatorSettings,
        as: 'creatorSettings',
        raw: true,
      },
      {
        attributes: ['id', 'price', 'discount', 'duration'],
        model: SubscriptionBundles,
        as: 'subscriptionBundles',
        raw: true,
      },
      {
        // attributes: ['id', 'price', 'discount', 'duration'],
        model: Promotions,
        as: 'promotions',
        where: { link: false },
        required: false,
        raw: true,
      }
    );

    attributes.push([
      sequelize.literal(`(
                    "creatorSettings"."subscriptionPrice"
                )`),
      'subscriptionPrice',
    ]);
  }

  if (getOptions.hasStory && cookie) {
    activeStories = await checkUsersHasActiveStory(users, cookie);
  }

  if (validateForUser) {
    if (validationOptions.subscribed && !getOptions.activeSubscription) {
      attributes.push([
        sequelize.literal(`(
                    SELECT true
                    FROM "Lists" AS l
                    INNER JOIN "Connections" as c ON l.id = c."listId"
                    WHERE l."userId" = ${validateForUser} AND l."type" = 'following' AND c."userId" = "User".id AND c."expiredAt" IS NULL
                ) IS NOT NULL`),
        'subscribed',
      ]);
    }

    if (validationOptions.blocked) {
      attributes.push([
        sequelize.literal(`(
                    SELECT l.id
                    FROM "Lists" AS l
                    INNER JOIN "Connections" as c ON l.id = c."listId"
                    WHERE l."userId" = ${validateForUser} AND l."type" = 'blocked' AND c."userId" = "User".id AND c."expiredAt" IS NULL
                ) IS NOT NULL`),
        'blocked',
      ]);
    }

    if (validationOptions.blockedReversal) {
      attributes.push([
        sequelize.literal(`(
                    SELECT l.id
                    FROM "Lists" AS l
                    INNER JOIN "Connections" as c ON l.id = c."listId"
                    WHERE l."userId" = "User".id AND l."type" = 'blocked' AND c."userId" = ${validateForUser} AND c."expiredAt" IS NULL
                ) IS NOT NULL`),
        'blockedReversal',
      ]);
    }

    if (validationOptions.restricted) {
      attributes.push([
        sequelize.literal(`(
                    SELECT l.id
                    FROM "Lists" AS l
                    INNER JOIN "Connections" as c ON l.id = c."listId"
                    WHERE l."userId" = ${validateForUser} AND l."type" = 'restricted' AND c."userId" = "User".id AND c."expiredAt" IS NULL
                ) IS NOT NULL`),
        'restricted',
      ]);
    }

    if (validationOptions.restrictedReversal) {
      attributes.push([
        sequelize.literal(`(
                    SELECT l.id
                    FROM "Lists" AS l
                    INNER JOIN "Connections" as c ON l.id = c."listId"
                    WHERE l."userId" = "User".id AND l."type" = 'restricted' AND c."userId" = ${validateForUser} AND c."expiredAt" IS NULL
                ) IS NOT NULL`),
        'restrictedReversal',
      ]);
    }

    if (validationOptions.reported) {
      attributes.push([
        sequelize.literal(`(
                    SELECT r.id
                    FROM "ReportedUsers" AS r                    
                    WHERE r."userId" = "User".id AND r."byUserId" = ${validateForUser}
                ) IS NOT NULL`),
        'reported',
      ]);
    }

    if (validationOptions.isFriend) {
      attributes.push([
        sequelize.literal(`(
                    SELECT fl.id
                    FROM "FriendLists" AS fl                    
                    WHERE fl.status = 'accepted' AND ((fl."userOneId" = "User".id AND fl."userTwoId" = ${validateForUser}) 
                    OR (fl."userOneId" =  ${validateForUser} AND fl."userTwoId" = "User".id))
                ) IS NOT NULL`),
        'isFriend',
      ]);
    }

    if (getOptions.activeSubscription) {
      activeSubscriptions = await fetchActiveSubscriptions(
        validateForUser,
        users
      );
    }

    if (getOptions.listsIncludedUser) {
      const lists = await Connections.findAll({
        attributes: ['Connections.userId'],
        where: {
          userId: { [Op.in]: users },
          expiredAt: { [Op.is]: null },
        },
        include: {
          model: Lists,
          as: 'list',
          attributes: ['id', 'type', 'name'],
          where: {
            userId: validateForUser,
            type: { [Op.ne]: 'followers' },
          },
          required: true,
        },
        raw: true,
      });

      lists.forEach((el) => {
        if (!listsIncludedUser[el.userId]) listsIncludedUser[el.userId] = [];
        listsIncludedUser[el.userId].push({
          id: el['list.id'],
          type: el['list.type'],
          name: el['list.name'],
        });
      });
    }
  }

  let usersData = await User.scope('withId').findAll({
    where: { id: { [Op.in]: users } },
    attributes,
    ...photoOptions,
    include,
  });

  if (usersData.length) {
    return new Promise((resolve, reject) => {
      eachOfLimit(
        usersData,
        10,
        async ({ dataValues: user }, i) => {
          if (getOptions.activeSubscription) {
            user.subscribed = false;

            const activeSubscription = activeSubscriptions.find(
              (el) => el.userId === user.id
            );

            if (activeSubscription) {
              user.subscribed = true;
              user.currentSubscriptionPrice =
                activeSubscription['subscriptionDetails.price'];
              user.subscribedAt = new Date(activeSubscription['createdAt']);
              user.subscriptionExpireAt = activeSubscription['expireAt'];
              user.checkRenewal =
                activeSubscription['subscriptionDetails.checkRenewal'] || null;
              user.autoRenewal =
                activeSubscription['subscriptionDetails.autoRenewal'] || null;
              user.cancelRenewal =
                activeSubscription['subscriptionDetails.autoRenewal'] &&
                !['free', 'trial'].includes(
                  activeSubscription['subscriptionDetails.type']
                );
            } else {
              user.subscribed = false;
            }
          }

          if (user.subscriptionBundles) {
            user.subscriptionBundles = user.subscriptionBundles
              .map((el) => el.dataValues)
              .sort((a, b) => a.duration - b.duration);
          }
          if (user.promotions?.length) {
            user.promotions = await validatePromotions(
              user.promotions.map((el) => el.dataValues),
              validateForUser
            );
          }
          delete user.UserSettings;
          delete user.creatorSettings;

          if (getOptions.hasStory) {
            user.hasStory = Boolean(activeStories?.[user.id]?.hasStory);
            user.hasNewStory = Boolean(activeStories?.[user.id]?.hasNewStory);
          }

          if (getOptions.listsIncludedUser) {
            user.lists = listsIncludedUser[user.id] || [];
          }

          /** Add creator second account user id if et exists */
          if (getOptions.getSecondAccount && checkIsCreator(user.roleId)) {
            const isPaidCreator = getRoleFromId(user.roleId) === 'paidCreator';
            const creatorsCouple = await CreatorsCouples.findOne({
              where: isPaidCreator
                ? { paidUserId: user.id }
                : { mainUserId: user.id },
              raw: true,
            });

            if (creatorsCouple) {
              if (isPaidCreator) {
                user.mainUserId = creatorsCouple.mainUserId;
                user.secondUserId = creatorsCouple.mainUserId;
              } else {
                user.secondUserId = creatorsCouple.mainUserId;
              }
            }
          }

          if (
            getOptions.getSubAdminPermissionGroupIds &&
            getRoleFromId(user.roleId) === 'subAdmin'
          ) {
            user.permissionGroupIds =
              (
                await SubAdminPermissions.findOne({
                  where: { userId: user.id },
                  raw: true,
                })
              ).permissionGroupIds || [];
          }

          if (getOptions.getDataInArray) {
            result[i] = user;
          } else {
            result[user.id] = user;
          }
        },

        (err) => {
          if (err) reject(err);

          if (oneUserId && !getOptions.keepFormatForOneUser)
            resolve(getOptions.getDataInArray ? result[0] : result[oneUserId]);
          else resolve(result);
        }
      );
    });
  }
  return null;
}

module.exports = {
  getUserById,
  getUserByFilter,
  getUsersDataByIds,
  getUserAllData,
  getUserDetails,
  makeReport,
  getUserSettings,
  fetchUserDataByFilter,
  getUsersIdsByFilter,
  getUserReferral,
  getUserByUsername,
  fetchUsersData,
  fetchUsersStripeDetails, // temp
  fetchUsersCardAccounts, // temp
  addUsersCardAccounts, // temp
};
