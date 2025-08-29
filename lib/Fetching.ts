import { apiJaihomV1, apiV1, Fetching } from "./api";

interface conector {
  api: Fetching
  query: string;
  variables: object;
  type: "json" | "formData"
}
export const fetchApiV1: CallableFunction = async ({ query, type, variables }: conector): Promise<any> => {
  return await conector({ api: apiV1, query, variables, type })
}

export const fetchApiJaihomV1: CallableFunction = async ({ query, type, variables }: conector): Promise<any> => {
  return await conector({ api: apiJaihomV1, query, variables, type })
}

const conector: CallableFunction = async ({ api, query = ``, variables = {}, type = "json", }: conector): Promise<any> => {
  try {
    if (type === "json") {
      const {
        data: { data },
      } = await api.graphql({ query, variables });
      return Object.values(data)[0];
    } else if (type === "formData") {
      const formData = new FormData();
      const values = Object?.entries(variables);

      // Generar el map del Form Data para las imagenes
      const map = values?.reduce((acc: any, item: any) => {
        if (item[1] instanceof File) {
          acc[item[0]] = [`variables.${item[0]}`];
        }
        if (item[1] instanceof Object) {
          Object.entries(item[1]).forEach((el) => {
            if (el[1] instanceof File) {
              acc[el[0]] = [`variables.${item[0]}.${el[0]}`];
            }
            if (el[1] instanceof Object) {
              Object.entries(el[1]).forEach((elemento) => {
                if (elemento[1] instanceof File) {
                  acc[elemento[0]] = [
                    `variables.${item[0]}.${el[0]}.${elemento[0]}`,
                  ];
                }
              });
            }
          });
        }
        return acc;
      }, {});

      // Agregar filas al FORM DATA

      formData.append("operations", JSON.stringify({ query, variables }));
      formData.append("map", JSON.stringify(map));
      values.forEach((item) => {
        if (item[1] instanceof File) {
          formData.append(item[0], item[1]);
        }
        if (item[1] instanceof Object) {
          Object.entries(item[1]).forEach((el) => {
            if (el[1] instanceof File) {
              formData.append(el[0], el[1]);
            }
            if (el[1] instanceof Object) {
              Object.entries(el[1]).forEach((elemento) => {
                if (elemento[1] instanceof File) {
                  formData.append(elemento[0], elemento[1]);
                }
              });
            }
          });
        }
      });

      const { data } = await api.graphql(formData);

      if (data.errors) {
        throw new Error(JSON.stringify(data.errors));
      }

      return Object.values(data.data)[0];
    }
  } catch (error) {
    console.log(error);
  }
};



// const graphqlFetch = async (query: string, variables?: any) => {
//   try {
//     const response = await instanceApiV1.post('/graphql', {
//       query,
//       variables,
//     });
//     return response.data.data;
//   } catch (error) {
//     console.error('GraphQL Mutation Error:', error);
//     throw error;
//   }
// };

// Tipos para las respuestas de la API
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface CustomClaimsData {
  _id: string;
  uid: string;
  email: string | null;
  customClaims: any;
  role: string;
  plan: string;
}

export const queries = {
  getCustomClaims: `query getCustomClaims($uid: String!) {
    getCustomClaims(uid: $uid) {
      success
      message
      data {
        uid
        email
        role
        plan
        assignedAt
      }
    }
  }`,
  assignCustomClaims: `mutation assignCustomClaims($args: AssignCustomClaimsInput!) {
    assignCustomClaims(args: $args) {
      success
      message
      data {
        uid
        email
        role
        plan
        assignedAt
      }
    }
  }`,
  emailExists: `query emailExists($args: EmailExistsArgs!) {
    emailExists(args: $args)
  }`,
  getGeoInfo: `query getGeoInfo {
    getGeoInfo {
      acceptLanguage
      connectingIp
      ipcountry
      loop
      referer
    }
  }`,
  createUser: `mutation createUser($args: UserInput!) {
    createUser(args: $args) {
      _id
    }
  }`,
  getUsers: `query getUsers {
    getUsers {
      _id
      name
      email
      phone
      plan
      role
      active
      emailVerified
      photoURL
      createdAt
      updatedAt
    }
  }`,
  // Business Queries
  getBusiness: `query getBusiness($id: ID!) {
    business(id: $id) {
      _id
      name
      ownerId
      country
      isChain
      slug
      logo
      description
      address
      phoneNumber
      socialMedia {
        instagram
        facebook
        whatsapp
        tiktok
      }
                 branches {
             name
             address
             country
             locality
             manager
             phoneNumber
             isActive
           }
           activeBranches {
             name
             address
             country
             locality
             manager
             phoneNumber
             isActive
           }
      isActive
      createdAt
      updatedAt
    }
  }`,
  getBusinessBySlug: `query getBusinessBySlug($slug: String!) {
    businessBySlug(slug: $slug) {
      _id
      name
      ownerId
      country
      isChain
      slug
      logo
      description
      address
      phoneNumber
      socialMedia {
        instagram
        facebook
        whatsapp
        tiktok
      }
                 branches {
             name
             address
             country
             locality
             manager
             phoneNumber
             isActive
           }
           activeBranches {
             name
             address
             country
             locality
             manager
             phoneNumber
             isActive
           }
      isActive
      createdAt
      updatedAt
    }
  }`,
  getBusinessesByOwner: `query getBusinessesByOwner($ownerId: String!) {
    businessesByOwner(ownerId: $ownerId) {
      _id
      name
      ownerId
      country
      isChain
      slug
      logo
      description
      address
      phoneNumber
      socialMedia {
        instagram
        facebook
        whatsapp
        tiktok
      }
                 branches {
             name
             address
             country
             locality
             manager
             phoneNumber
             isActive
           }
           activeBranches {
             name
             address
             country
             locality
             manager
             phoneNumber
             isActive
           }
      isActive
      createdAt
      updatedAt
    }
  }`,
  checkSlugAvailable: `query checkSlugAvailable($slug: String!) {
    slugAvailable(slug: $slug)
  }`,
  // Business Mutations
  createBusiness: `mutation createBusiness($args: BusinessInput!) {
    createBusiness(args: $args) {
      _id
      name
      ownerId
      country
      isChain
      slug
      logo
      description
      address
      phoneNumber
      socialMedia {
        instagram
        facebook
        whatsapp
        tiktok
      }
                 branches {
             name
             address
             country
             locality
             manager
             phoneNumber
             isActive
           }
           activeBranches {
             name
             address
             country
             locality
             manager
             phoneNumber
             isActive
           }
      isActive
      createdAt
      updatedAt
    }
  }`,
  updateBusiness: `mutation updateBusiness($id: ID!, $args: BusinessInput!) {
    updateBusiness(id: $id, args: $args) {
      _id
      name
      ownerId
      country
      isChain
      slug
      logo
      description
      address
      phoneNumber
      socialMedia {
        instagram
        facebook
        whatsapp
        tiktok
      }
                 branches {
             name
             address
             country
             locality
             manager
             phoneNumber
             isActive
           }
           activeBranches {
             name
             address
             country
             locality
             manager
             phoneNumber
             isActive
           }
      isActive
      createdAt
      updatedAt
    }
  }`,
  deleteBusiness: `mutation deleteBusiness($id: ID!) {
    deleteBusiness(id: $id)
  }`,
  addBranch: `mutation addBranch($businessId: ID!, $args: BranchInput!) {
    addBranch(businessId: $businessId, args: $args) {
      _id
      name
      ownerId
      country
      isChain
      slug
      logo
      description
      address
      phoneNumber
      socialMedia {
        instagram
        facebook
        whatsapp
        tiktok
      }
                 branches {
             name
             address
             country
             locality
             manager
             phoneNumber
             isActive
           }
           activeBranches {
             name
             address
             country
             locality
             manager
             phoneNumber
             isActive
           }
      isActive
      createdAt
      updatedAt
    }
  }`,
  updateBranch: `mutation updateBranch($businessId: ID!, $branchIndex: Int!, $args: BranchInput!) {
    updateBranch(businessId: $businessId, branchIndex: $branchIndex, args: $args) {
      _id
      name
      ownerId
      country
      isChain
      slug
      logo
      description
      address
      phoneNumber
      socialMedia {
        instagram
        facebook
        whatsapp
        tiktok
      }
                 branches {
             name
             address
             country
             locality
             manager
             phoneNumber
             isActive
           }
           activeBranches {
             name
             address
             country
             locality
             manager
             phoneNumber
             isActive
           }
      isActive
      createdAt
      updatedAt
    }
  }`,
  removeBranch: `mutation removeBranch($businessId: ID!, $branchIndex: Int!) {
    removeBranch(businessId: $businessId, branchIndex: $branchIndex) {
      _id
      name
      ownerId
      country
      isChain
      slug
      logo
      description
      address
      phoneNumber
      socialMedia {
        instagram
        facebook
        whatsapp
        tiktok
      }
                 branches {
             name
             address
             country
             locality
             manager
             phoneNumber
             isActive
           }
           activeBranches {
             name
             address
             country
             locality
             manager
             phoneNumber
             isActive
           }
      isActive
      createdAt
      updatedAt
    }
  }`
}