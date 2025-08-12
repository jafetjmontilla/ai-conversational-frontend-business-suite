import { apiV1, Fetching } from "./api";

interface conector {
  api: Fetching
  query: string;
  variables: object;
  type: "json" | "formData"
}
export const fetchApiV1: CallableFunction = async ({ query, type, variables }: conector): Promise<any> => {
  return await conector({ api: apiV1, query, variables, type })
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
  uid: string;
  email: string | null;
  customClaims: any;
  role: string;
  plan: string;
}

// // Función para asignar custom claims a un usuario
// export const assignCustomClaims = async (uid: string, role: string = 'client', plan: string = 'free'): Promise<ApiResponse<CustomClaimsData>> => {
//   try {
//     const data = await graphqlFetch(queries.assignCustomClaims, { args: { uid, role, plan } });
//     const res = data.assignCustomClaims;
//     return {
//       success: res.success,
//       message: res.message,
//       data: res.data
//     };
//   } catch (error: any) {
//     return {
//       success: false,
//       message: 'Error de conexión con el servidor',
//       error: error.message
//     } as any;
//   }
// };

// // Función para obtener información de custom claims de un usuario
// export const getCustomClaims = async (uid: string): Promise<ApiResponse<CustomClaimsData>> => {
//   try {
//     const data = await graphqlFetch(queries.getCustomClaims, { uid });
//     const res = data.getCustomClaims;
//     return {
//       success: res.success,
//       message: res.message,
//       data: res.data
//     };
//   } catch (error: any) {
//     return {
//       success: false,
//       message: 'Error de conexión con el servidor',
//       error: error.message
//     } as any;
//   }
// };

export const queries = {
  getCustomClaims: `query getCustomClaims($uid: ID!) {
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

}