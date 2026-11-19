import { createAccessControl } from "better-auth/plugins/access";
import {
  defaultStatements,
  ownerAc,
  adminAc,
  memberAc,
} from "better-auth/plugins/organization/access";

const statement = {
  ...defaultStatements,
} as const;

export const ac = createAccessControl(statement);

export const owner = ac.newRole({
  ...ownerAc.statements,
});

export const admin = ac.newRole({
  ...adminAc.statements,
});

export const employee = ac.newRole({
  ...memberAc.statements,
  invitation: ["create"],
});

export const client = ac.newRole({
  ...memberAc.statements,
});

export const member = ac.newRole({
  ...memberAc.statements,
});
