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

export const queries = {
  getCustomClaims: `query getCustomClaims($uid: String!) {
    getCustomClaims(uid: $uid) {
      success
      message
      data {
        uid
        email
        role
        phone
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
        phone
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
  getUser: `query getUser($_id: ID, $uid: String) {
    getUser(_id: $_id, uid: $uid) {
      _id
      name
      email
      phone
      role
      active
      emailVerified
      photoURL  
      createdAt
      updatedAt
    }
  }`,
  getUsers: `query getUsers {
    getUsers {
      _id
      name
      email
      phone
      role
      active
      emailVerified
      token
      used
      expiresAt
      createdBy
      whatsappSent
      uid
      photoURL
      createdAt
      updatedAt
    }
  }`,
  // Queries para invitaciones
  createUserInvitation: `mutation createUserInvitation($args: CreateInvitationInput!) {
    createUserInvitation(args: $args) {
      success
      message
      data {
        _id
        name
        email
        phone
        role
        token
        expiresAt
        used
        createdBy
        whatsappSent
        createdAt
      }
    }
  }`,
  sendUserInvitation: `mutation sendUserInvitation($args: SendInvitationArgs!) {
    sendUserInvitation(args: $args) {
      success
      message
      data {
        _id
        name
        email
        phone
        role
        token
        expiresAt
        used
        createdBy
        whatsappSent
        createdAt
      }
    }
  }`,
  validateInvitationToken: `query validateInvitationToken($token: String!) {
    validateInvitationToken(token: $token) {
      success
      message
      data {
        _id
        name
        email
        phone
        role
        token
        expiresAt
        used
        createdBy
        whatsappSent
        createdAt
      }
      userData {
        name
        email
        phone
        role
      }
    }
  }`,
  completeUserRegistration: `mutation completeUserRegistration($args: CompleteRegistrationInput!) {
    completeUserRegistration(args: $args) {
      success
      message
      data {
        _id
        name
        email
        phone
        role
        token
        expiresAt
        used
        createdBy
        whatsappSent
        createdAt
      }
    }
  }`,
  completeUserRegistrationWithGoogle: `mutation completeUserRegistrationWithGoogle($args: CompleteGoogleRegistrationInput!) {
    completeUserRegistrationWithGoogle(args: $args) {
      success
      message
      data {
        _id
        name
        email
        phone
        role
        token
        expiresAt
        used
        createdBy
        whatsappSent
        createdAt
      }
    }
  }`,
  updateUser: `mutation updateUser($id: ID!, $args: UserInput!) {
    updateUser(id: $id, args: $args) {
      _id
      name
      email
      phone
      role
      active
      emailVerified
      photoURL
      createdAt
      updatedAt
    }
  }`,
  // Mutaciones para gestión de invitaciones
  updateUserInvitation: `mutation updateUserInvitation($invitationId: String!, $args: UpdateInvitationInput!) {
    updateUserInvitation(invitationId: $invitationId, args: $args) {
      success
      message
      data {
        _id
        name
        email
        phone
        role
        token
        expiresAt
        used
        createdBy
        whatsappSent
        createdAt
      }
    }
  }`,
  deleteUserInvitation: `mutation deleteUserInvitation($invitationId: String!) {
    deleteUserInvitation(invitationId: $invitationId) {
      success
      message
    }
  }`,
  updateProfile: `mutation updateProfile($args: UpdateProfileInput!) {
    updateProfile(args: $args) {
      name
      email
      phone
      photoURL
    }
  }`,
  // Queries para reportes de pagos
  getPaymentReportResults: `query getPaymentReportResults($args: inputPaymentReportResults, $sort: sortCriteriaPaymentReportResults, $skip: Int, $limit: Int) {
    getPaymentReportResults(args: $args, sort: $sort, skip: $skip, limit: $limit) {
      total
      results {
        id_factura
        estado
        total_cobrado
        accion
        messages
        referencia
        fecha_pago
        saldo
        total
        forma_pago
        telefono
        createdAt
        updatedAt
      }
    }
  }`,
  reloadInvoice: `query reloadInvoice($id_factura: String!) {
    reloadInvoice(id_factura: $id_factura) {
      id_factura
      estado
      total_cobrado
      accion
      messages
      referencia
      fecha_pago
      saldo
      total
      forma_pago
      telefono
      createdAt
      updatedAt
    }
  }`,
  getTransacciones: `query getTransacciones($args: inputTransaccion, $sort: sortCriteriaTransaccion, $skip: Int, $limit: Int) {
    getTransacciones(args: $args, sort: $sort, skip: $skip, limit: $limit) {
      total
      results {
        _id
        referencia
        banco
        monto
        facturas {
          id_factura
          total_cobrado
          fecha_pago
          fecha_pago_ref
          referencia
          forma_pago
          cajero
        }
        conciliado
        criterio
        fecha
        createdAt
        updatedAt
      }
    }
  }`,
  getFacturas: `query getFacturas($args: inputFactura, $sort: sortCriteriaFactura, $skip: Int, $limit: Int) {
    getFacturas(args: $args, sort: $sort, skip: $skip, limit: $limit) {
      total
      results {
        _id
        id_factura
        fecha_pago
        scanedFacturas
        scanedFacturasTotal
        fecha_pago_ref
        total_cobrado
        referencia
        forma_pagoID
        forma_pago
        cajeroID
        cajero
        pagado
        recargado
        criterio
        transacciones {
          _id
          banco
          fecha
          referencia
          descripcion
          monto
          conciliado
          criterio
          facturas {
            _id
            id_factura
          }
          createdAt
          updatedAt
        }
        createdAt
        updatedAt
      }
    }
  }`,
  runConciliation: `mutation runConciliation($rangeDate: rangeDate) {
    runConciliation(rangeDate: $rangeDate)
  }`,
  uploadBanco: `mutation uploadBanco($file: Upload!, $banco: String!) {
    uploadBanco(file: $file, banco: $banco)
  }`,
  getUploadFiles: `query getUploadFiles($skip: Int, $limit: Int) {
    getUploadFiles(skip: $skip, limit: $limit) {
      total
      results {
        _id
        lote
        path
        createdAt
      }
    }
  }`,
  fileUpload: `mutation($file:Upload!, $args:String)
  {
    fileUpload(file:$file, args:$args){
      _id
      lote
      path
      createdAt
    }
  }`,
  // Queries para retenciones IVA
  getSupplier: `query getSupplier($args: inputSupplier, $sort: sortCriteriaSupplier, $skip: Int, $limit: Int) {
    getSupplier(args: $args, sort: $sort, skip: $skip, limit: $limit) {
      total
      results {
        _id
        letterIdentifier
        numberIdentifier
        name
        address
        phone
        email
      }
    }
  }`,
  createSupplier: `mutation createSupplier($args: [inputSupplier!]!) {
    createSupplier(args: $args) {
      total
      results {
        _id
        letterIdentifier
        numberIdentifier
        name
        address
        phone
        email
      }
    }
  }`,
  updateSupplier: `mutation updateSupplier($args: inputSupplier!) {
    updateSupplier(args: $args) {
      _id
      letterIdentifier
      numberIdentifier
      name
      address
      phone
      email
    }
  }`,
  searchSupplier: `query searchSupplier($text: String!) {
    searchSupplier(text: $text) {
      total
      results {
        _id
        letterIdentifier
        numberIdentifier
        name
        address
        phone
        email
      }
    }
  }`,
  // Queries para tasas BCV
  createTasaBCV: `mutation createTasaBCV($fecha: Date, $tasa: Float!) {
    createTasaBCV(fecha: $fecha, tasa: $tasa) {
      _id
      tasa
      fecha
      createdAt
    }
  }`,
  getTasaBCV: `query getTasaBCV($sort: sortCriteriaTasaBCV, $skip: Int, $limit: Int) {
    getTasaBCV(skip: $skip, limit: $limit, sort: $sort) {
      total
      results {
        _id
        tasa
        fecha
        createdAt
      }
    }
  }`,
  deleteTasaBCV: `mutation deleteTasaBCV($_id: ID!) {
    deleteTasaBCV(_id: $_id)
  }`,
  // Queries adicionales
  getLog: `query getLog($skip: Int, $limit: Int, $time: Date) {
    getLog(skip: $skip, limit: $limit, time: $time) {
      total
      results {
        sn_onu
        id_servicio
        estado
        estadoValir
        usuario
        smartOlt
        confirmation
        createdAt
      }
    }
  }`,
  resyncOnus: `mutation resyncOnus($args: [String!]!) {
    resyncOnus(args: $args)
  }`,
  getFacturaWispHup: `query getFacturaWispHup($id_factura: String!) {
    getFacturaWispHup(id_factura: $id_factura)
  }`,
  refreshFacturaWispHup: `mutation refreshFacturaWispHup($ids_factura: [String!]!) {
    refreshFacturaWispHup(ids_factura: $ids_factura)
  }`,
}