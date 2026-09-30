import prisma from "@/lib/prisma";

export interface UserDataScope {
  userId: number;
  roleType: "superadmin" | "admin" | "user";
  roleName: string;
  isFullAccess: boolean;
  isMarketer: boolean;
  isAssociationStaff: boolean;
  isResearcher: boolean;
  userAssociationId: number | null;
  userMarketerId: number | null;
  allowedAssociationIds: number[] | null; // null means all associations allowed
  allowedBeneficiaryAssociationIds: number[] | null; // null means all beneficiaries allowed
  assocWhere: any; // Prisma filter for Association
  beneficiaryWhere: any; // Prisma filter for Beneficiary
  marketerWhere: any; // Prisma filter for Marketer
}

/**
 * Computes data scoping permissions for a logged-in user according to their role and linked relations.
 */
export async function getUserDataScope(userId: number): Promise<UserDataScope> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      associationId: true,
      marketerId: true,
      role: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
    },
  });

  if (!user) {
    return {
      userId,
      roleType: "user",
      roleName: "UNKNOWN",
      isFullAccess: false,
      isMarketer: false,
      isAssociationStaff: false,
      isResearcher: false,
      userAssociationId: null,
      userMarketerId: null,
      allowedAssociationIds: [],
      allowedBeneficiaryAssociationIds: [],
      assocWhere: { id: -1 },
      beneficiaryWhere: { associationId: -1 },
      marketerWhere: { id: -1 },
    };
  }

  const roleType = (user.role.type || "user") as "superadmin" | "admin" | "user";
  const roleName = user.role.name ? user.role.name.toUpperCase() : "";
  const isDataManager = roleName.includes("DATA_MANAGER") || roleName.includes("DATA MANAGER") || roleName.includes("مدير البيانات");
  const isFullAccess = roleType === "superadmin" || roleType === "admin" || isDataManager;

  const isMarketer = roleName.includes("MARKETER") || Boolean(user.marketerId);
  const isAssociationStaff = roleName.includes("CHARITY") || roleName.includes("STAFF") || Boolean(user.associationId);
  const isResearcher = roleName.includes("RESEARCHER");

  // 1. SuperAdmin, Admin, & Data Manager: Full access to all associations, beneficiaries, & marketers
  if (isFullAccess) {
    return {
      userId,
      roleType,
      roleName,
      isFullAccess: true,
      isMarketer,
      isAssociationStaff,
      isResearcher,
      userAssociationId: user.associationId,
      userMarketerId: user.marketerId,
      allowedAssociationIds: null,
      allowedBeneficiaryAssociationIds: null,
      assocWhere: {},
      beneficiaryWhere: {},
      marketerWhere: {},
    };
  }

  let allowedAssocIds: number[] = [];
  let allowedBenAssocIds: number[] = [];

  // 2. Marketer User (or Social Researcher linked to a Marketer)
  if (user.marketerId) {
    const marketerAssocs = await prisma.marketerAssociation.findMany({
      where: { marketerId: user.marketerId },
      select: { associationId: true },
    });
    const ids = marketerAssocs.map((ma) => ma.associationId);
    allowedAssocIds = ids;
    allowedBenAssocIds = ids;
  }
  // 3. Association Staff / Manager / Researcher linked to an Association
  else if (user.associationId) {
    allowedAssocIds = [user.associationId];
    allowedBenAssocIds = [user.associationId];
  }

  // Construct Prisma WHERE filters
  let assocWhere: any = {};
  let beneficiaryWhere: any = {};
  let marketerWhere: any = {};

  if (user.marketerId) {
    assocWhere = { id: { in: allowedAssocIds } };
    beneficiaryWhere = { associationId: { in: allowedBenAssocIds } };
    marketerWhere = { id: user.marketerId };
  } else if (user.associationId) {
    assocWhere = {}; // Allow browsing associations
    beneficiaryWhere = { associationId: user.associationId };
    marketerWhere = {
      associations: {
        some: {
          associationId: user.associationId,
        },
      },
    };
  } else {
    // User is unassigned to any marketer or association -> block all data access
    assocWhere = { id: -1 };
    beneficiaryWhere = { id: -1 };
    marketerWhere = { id: -1 };
  }

  return {
    userId,
    roleType,
    roleName,
    isFullAccess: false,
    isMarketer,
    isAssociationStaff,
    isResearcher,
    userAssociationId: user.associationId,
    userMarketerId: user.marketerId,
    allowedAssociationIds: user.marketerId ? allowedAssocIds : null,
    allowedBeneficiaryAssociationIds: user.marketerId ? allowedBenAssocIds : (user.associationId ? [user.associationId] : null),
    assocWhere,
    beneficiaryWhere,
    marketerWhere,
  };
}
