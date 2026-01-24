import { apiImgbbV1, apiJaihomV1, apiV1, Fetching } from "./api";

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

export const fetchApiImgbbV1: CallableFunction = async (imageFile: File | string, expiration?: number): Promise<any> => {
  return await apiImgbbV1.upload(imageFile, expiration)
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
      code
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
        code
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
        code
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
        code
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
  // Query para obtener tasas BCV
  getTasasBCV: `query getTasasBCV($fecha: String!, $skip: Int!, $limit: Int!) {
    getTasasBCV(fecha: $fecha, skip: $skip, limit: $limit) {
      tasa
      fecha
    }
  }`,
  // Queries para streaming
  getChannels: `query getChannels($status: String) {
    getChannels(status: $status) {
      _id
      numberChannel
      title
      groupTitle
      info
      logo
      src
      status
      createdAt
      updatedAt
    }
  }`,
  getChannel: `query getChannel($_id: ID!) {
    getChannel(_id: $_id) {
      _id
      numberChannel
      title
      groupTitle
      info
      logo
      src
      status
      createdAt
      updatedAt
    }
  }`,
  getStreamingChannels: `query getStreamingChannels {
    getStreamingChannels {
      _id
      channelId
      numberChannel
      status
      processId
      startedAt
      lastError
      errorCount
      ffmpegOptions {
        useGpuTranscoding
      }
      channel {
        _id
        numberChannel
        title
        groupTitle
        info
        logo
        src
        status
      }
      createdAt
      updatedAt
    }
  }`,
  getStreamingChannel: `query getStreamingChannel($channelId: ID!) {
    getStreamingChannel(channelId: $channelId) {
      _id
      channelId
      numberChannel
      status
      processId
      startedAt
      lastError
      errorCount
      ffmpegOptions {
        hwaccel
        hwaccelDevice
        hwaccelOutputFormat
        videoCodec
        videoQuality
        audioCodec
        audioBitrate
        resolution
        aspectRatio
        hlsTime
        hlsListSize
        useGpuTranscoding
      }
      channel {
        _id
        numberChannel
        title
        groupTitle
        info
        logo
        src
        status
      }
      createdAt
      updatedAt
    }
  }`,
  createChannel: `mutation createChannel($args: ChannelInput!) {
    createChannel(args: $args) {
      _id
      numberChannel
      title
      groupTitle
      info
      logo
      src
      status
      createdAt
      updatedAt
    }
  }`,
  updateChannel: `mutation updateChannel($_id: ID!, $args: ChannelInput!) {
    updateChannel(_id: $_id, args: $args) {
      _id
      numberChannel
      title
      groupTitle
      info
      logo
      src
      status
      createdAt
      updatedAt
    }
  }`,
  deleteChannel: `mutation deleteChannel($_id: ID!) {
    deleteChannel(_id: $_id)
  }`,
  startStreaming: `mutation startStreaming($channelId: ID!, $ffmpegOptions: FfmpegOptionsInput) {
    startStreaming(channelId: $channelId, ffmpegOptions: $ffmpegOptions) {
      _id
      channelId
      numberChannel
      status
      processId
      startedAt
      errorCount
    }
  }`,
  stopStreaming: `mutation stopStreaming($channelId: ID!) {
    stopStreaming(channelId: $channelId)
  }`,
  restartStreaming: `mutation restartStreaming($channelId: ID!) {
    restartStreaming(channelId: $channelId) {
      _id
      channelId
      numberChannel
      status
      processId
      startedAt
      errorCount
    }
  }`,
  updateFfmpegOptions: `mutation updateFfmpegOptions($channelId: ID!, $ffmpegOptions: FfmpegOptionsInput!) {
    updateFfmpegOptions(channelId: $channelId, ffmpegOptions: $ffmpegOptions) {
      _id
      channelId
      numberChannel
      status
      ffmpegOptions {
        hwaccel
        hwaccelDevice
        hwaccelOutputFormat
        videoCodec
        videoQuality
        audioCodec
        audioBitrate
        resolution
        aspectRatio
        hlsTime
        hlsListSize
        useGpuTranscoding
      }
    }
  }`,
  getStreamingErrors: `query getStreamingErrors($channelId: ID!) {
    getStreamingErrors(channelId: $channelId) {
      channelId
      numberChannel
      error
      errorCount
      timestamp
    }
  }`,
  clearStreamingErrors: `mutation clearStreamingErrors($channelId: ID!) {
    clearStreamingErrors(channelId: $channelId)
  }`,
}