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

      // Crear una copia de variables con los archivos como null para el JSON
      const variablesForJson: any = {};
      const files: File[] = [];
      const map: Record<string, string[]> = {};
      let fileIndex = 0;

      // Procesar variables y extraer archivos
      values?.forEach(([key, value]) => {
        if (value instanceof File) {
          // Agregar archivo a la lista
          files.push(value);
          // Agregar al map con clave numérica
          map[fileIndex.toString()] = [`variables.${key}`];
          // Establecer como null en variables para JSON
          variablesForJson[key] = null;
          fileIndex++;
        } else if (value instanceof Object && value !== null && !Array.isArray(value)) {
          // Procesar objetos anidados
          const nestedObj: any = {};
          let hasFiles = false;

          Object.entries(value).forEach(([nestedKey, nestedValue]) => {
            if (nestedValue instanceof File) {
              files.push(nestedValue);
              map[fileIndex.toString()] = [`variables.${key}.${nestedKey}`];
              nestedObj[nestedKey] = null;
              fileIndex++;
              hasFiles = true;
            } else {
              nestedObj[nestedKey] = nestedValue;
            }
          });

          variablesForJson[key] = hasFiles ? nestedObj : value;
        } else {
          // Mantener el valor original para valores no-File
          variablesForJson[key] = value;
        }
      });

      // Agregar operations y map al FormData
      formData.append("operations", JSON.stringify({ query, variables: variablesForJson }));
      formData.append("map", JSON.stringify(map));

      // Agregar archivos con claves numéricas
      files.forEach((file, index) => {
        formData.append(index.toString(), file);
      });

      // NO leer el FormData aquí porque lo consume y queda vacío
      // Solo loggear información que no requiere leer el FormData
      console.log('=== FormData Debug ===');
      console.log('Map object:', map);
      console.log('Variables:', variables);
      console.log('FormData type:', formData instanceof FormData ? 'FormData' : typeof formData);
      console.log('======================');

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
  /** Una sola llamada: usuario actual + negocio (poblado desde user.business_id) + businessRole. */
  getMe: `query getMe {
    getMe {
      user {
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
      business {
        _id
        name
        businessId
        description
        active
        createdAt
        updatedAt
      }
      businessRole
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
  getBusinessInvitations: `query getBusinessInvitations($id: ID!) {
    getBusinessInvitations(id: $id) {
      _id
      name
      email
      phone
      role
      code
      used
      expiresAt
      createdBy
      whatsappSent
      createdAt
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
  // Negocios
  listBusinesses: `query listBusinesses {
    listBusinesses {
      _id
      name
      businessId
      description
      active
      legalName
      taxId
      slogan
      logoUrl
      email
      phone
      address {
        street
        number
        sector
        city
        stateProvince
        postalCode
        country
      }
      currency
      timezone
      language
      businessCategory
      defaultTaxPercent
      taxRegime
      digitalSignatureOrStamp
      invoiceNumbering {
        prefix
        rangeFrom
        rangeTo
      }
      createdAt
      updatedAt
    }
  }`,
  getBusiness: `query getBusiness($id: ID, $businessId: String) {
    getBusiness(id: $id, businessId: $businessId) {
      _id
      name
      businessId
      description
      active
      legalName
      taxId
      slogan
      logoUrl
      email
      phone
      address {
        street
        number
        sector
        city
        stateProvince
        postalCode
        country
      }
      currency
      timezone
      language
      businessCategory
      defaultTaxPercent
      taxRegime
      digitalSignatureOrStamp
      invoiceNumbering {
        prefix
        rangeFrom
        rangeTo
      }
      billingBaseCurrency
      billingDisplayCurrency
      billingExchangeRateSource
      billingCustomExchangeRate
      config {
        conversationTimeout
        messageLimit
        personality {
          tone
          language
          customInstructions
        }
        knowledgeSources {
          sourceId
          name
          roles
        }
        globalResponses {
          greeting
          goodbye
          noData
        }
        tools {
          name
          description
          params
        }
        dataProviders {
          id
          kind
          baseUrl
          endpoint
          auth {
            type
            headerName
            apiKeyMasked
          }
          tools
        }
      }
      whatsapps {
        metaCloudApiNumbers {
          phoneNumberId
          phoneNumber
          accessToken
          verifyToken
        }
        baileysApiNumbers {
          sessionId
          phoneNumber
        }
      }
      callbackUrl
      createdAt
      updatedAt
    }
  }`,
  getMyBusinessMemberships: `query getMyBusinessMemberships {
    getMyBusinessMemberships {
      userId
      business_id
      role
    }
  }`,
  getMyBusinesses: `query getMyBusinesses {
    getMyBusinesses {
      _id
      name
      businessId
    }
  }`,
  setCurrentBusiness: `mutation setCurrentBusiness($id: ID!) {
    setCurrentBusiness(id: $id)
  }`,
  createBusiness: `mutation createBusiness($args: CreateBusinessInput!) {
    createBusiness(args: $args) {
      _id
      name
      businessId
      description
      active
      createdAt
      updatedAt
    }
  }`,
  updateBusiness: `mutation updateBusiness($id: ID!, $args: UpdateBusinessInput!) {
    updateBusiness(id: $id, args: $args) {
      _id
      name
      businessId
      description
      active
      legalName
      taxId
      slogan
      logoUrl
      email
      phone
      address { street number sector city stateProvince postalCode country }
      currency
      timezone
      language
      businessCategory
      defaultTaxPercent
      taxRegime
      digitalSignatureOrStamp
      invoiceNumbering { prefix rangeFrom rangeTo }
      billingBaseCurrency
      billingDisplayCurrency
      billingExchangeRateSource
      billingCustomExchangeRate
      whatsapps {
        metaCloudApiNumbers { phoneNumberId phoneNumber accessToken verifyToken }
        baileysApiNumbers { sessionId phoneNumber }
      }
      callbackUrl
      createdAt
      updatedAt
    }
  }`,
  getBaileysSessionStatus: `query getBaileysSessionStatus($sessionId: String!) {
    getBaileysSessionStatus(sessionId: $sessionId) {
      id
      development
      userId
      isConnected
      qrCode
      phoneNumber
      connectionTime
      lastActivity
    }
  }`,
  createBaileysSession: `mutation createBaileysSession($id: ID!, $sessionId: String!, $phoneNumber: String) {
    createBaileysSession(id: $id, sessionId: $sessionId, phoneNumber: $phoneNumber) {
      success
      qrCode
      error
      session {
        id
        isConnected
        qrCode
        phoneNumber
      }
    }
  }`,
  removeBaileysNumber: `mutation removeBaileysNumber($id: ID!, $sessionId: String!, $disconnect: Boolean) {
    removeBaileysNumber(id: $id, sessionId: $sessionId, disconnect: $disconnect)
  }`,
  deleteBusiness: `mutation deleteBusiness($id: ID!) {
    deleteBusiness(id: $id)
  }`,
  getBusinessMembers: `query getBusinessMembers($id: ID!) {
    getBusinessMembers(id: $id) {
      userId
      business_id
      role
      name
      email
    }
  }`,
  setBusinessMember: `mutation setBusinessMember($args: SetBusinessMemberInput!) {
    setBusinessMember(args: $args) {
      userId
      business_id
      role
    }
  }`,
  removeBusinessMember: `mutation removeBusinessMember($userId: String!, $id: ID!) {
    removeBusinessMember(userId: $userId, id: $id)
  }`,
  // Facturación (id = business _id)
  getInvoices: `query getInvoices($id: ID!, $skip: Int, $limit: Int, $sort: sortCriteriaInvoice) {
    getInvoices(id: $id, skip: $skip, limit: $limit, sort: $sort) {
      total
      results {
        _id
        clientName
        clientId
        clientPhone
        items { _id id quantity description unitPrice total inventoryId invoiceId createdAt updatedAt }
        totalBs
        totalUsd
        status
        createdBy
        createdAt
        updatedAt
      }
    }
  }`,
  getInvoice: `query getInvoice($_id: ID!, $id: ID!) {
    getInvoice(_id: $_id, id: $id) {
      _id
      clientName
      clientId
      clientPhone
      items { _id id quantity description unitPrice total inventoryId invoiceId createdAt updatedAt }
      totalBs
      totalUsd
      status
      createdBy
      createdAt
      updatedAt
    }
  }`,
  createInvoice: `mutation createInvoice($id: ID!, $args: CreateInvoiceInput!) {
    createInvoice(id: $id, args: $args) {
      _id
      clientName
      clientId
      clientPhone
      items { _id id quantity description unitPrice total inventoryId invoiceId }
      totalBs
      totalUsd
      status
      createdBy
      createdAt
      updatedAt
    }
  }`,
  updateInvoice: `mutation updateInvoice($_id: ID!, $id: ID!, $args: UpdateInvoiceInput!) {
    updateInvoice(_id: $_id, id: $id, args: $args) {
      _id
      clientName
      clientId
      clientPhone
      items { _id id quantity description unitPrice total inventoryId invoiceId }
      totalBs
      totalUsd
      status
      createdBy
      createdAt
      updatedAt
    }
  }`,
  deleteInvoice: `mutation deleteInvoice($_id: ID!, $id: ID!) {
    deleteInvoice(_id: $_id, id: $id)
  }`,
  processPayment: `mutation processPayment($id: ID!, $args: ProcessPaymentInput!) {
    processPayment(id: $id, args: $args) {
      success
      message
      data {
        _id
        invoiceId
        paymentMethods { _id id name amountBs amountUsd urlSuport createdAt updatedAt }
        totalPaid
        exchangeRate
        status
        createdAt
      }
    }
  }`,
  getPayments: `query getPayments($id: ID!, $filters: PaymentFiltersInput) {
    getPayments(id: $id, filters: $filters) {
      total
      results {
        _id
        invoiceId
        paymentMethods { _id id name amountBs amountUsd urlSuport }
        totalPaid
        exchangeRate
        status
        createdAt
      }
    }
  }`,
  // Inventario (id = business _id)
  getInventoryItems: `query getInventoryItems($id: ID!, $description: String, $skip: Int, $limit: Int) {
    getInventoryItems(id: $id, description: $description, skip: $skip, limit: $limit) {
      _id
      code
      description
      type
      quantity
      unitCost
      salesPrice
      unitCostUsd
      salesPriceUsd
      profitPercentage
      status
      costHistory { value valorUsd updatedAt userId }
      priceHistory { value valorUsd updatedAt userId }
      quantityHistory { quantity concept updatedAt userId }
      createdBy
      createdAt
      updatedAt
    }
  }`,
  getInventoryItem: `query getInventoryItem($_id: ID!, $id: ID!) {
    getInventoryItem(_id: $_id, id: $id) {
      _id
      code
      description
      type
      quantity
      unitCost
      salesPrice
      unitCostUsd
      salesPriceUsd
      profitPercentage
      status
      costHistory { value valorUsd updatedAt userId }
      priceHistory { value valorUsd updatedAt userId }
      quantityHistory { quantity concept updatedAt userId }
      createdBy
      createdAt
      updatedAt
    }
  }`,
  getInventoryItemByCode: `query getInventoryItemByCode($id: ID!, $code: String!) {
    getInventoryItemByCode(id: $id, code: $code) {
      _id
      code
      description
      type
      quantity
      unitCost
      salesPrice
      unitCostUsd
      salesPriceUsd
      profitPercentage
      status
      createdBy
      createdAt
      updatedAt
    }
  }`,
  createInventoryItem: `mutation createInventoryItem($id: ID!, $args: InventoryItemInput!) {
    createInventoryItem(id: $id, args: $args) {
      _id
      code
      description
      type
      quantity
      unitCost
      salesPrice
      unitCostUsd
      salesPriceUsd
      profitPercentage
      status
      createdBy
      createdAt
      updatedAt
    }
  }`,
  updateInventoryItem: `mutation updateInventoryItem($_id: ID!, $id: ID!, $args: UpdateInventoryItemInput!) {
    updateInventoryItem(_id: $_id, id: $id, args: $args) {
      _id
      code
      description
      type
      quantity
      unitCost
      salesPrice
      unitCostUsd
      salesPriceUsd
      profitPercentage
      status
      createdBy
      createdAt
      updatedAt
    }
  }`,
  deleteInventoryItem: `mutation deleteInventoryItem($_id: ID!, $id: ID!) {
    deleteInventoryItem(_id: $_id, id: $id)
  }`,
  updateItemQuantity: `mutation updateItemQuantity($id: ID!, $_id: ID!, $newQuantity: Float!, $concept: String!) {
    updateItemQuantity(id: $id, _id: $_id, newQuantity: $newQuantity, concept: $concept) {
      _id
      quantity
      quantityHistory { quantity concept updatedAt userId }
    }
  }`,
  bulkCreateInventoryItems: `mutation bulkCreateInventoryItems($id: ID!, $items: [BulkInventoryItemInput!]!, $exchangeRate: Float!) {
    bulkCreateInventoryItems(id: $id, items: $items, exchangeRate: $exchangeRate) {
      _id
      code
      description
      type
      quantity
      unitCost
      salesPrice
      createdAt
    }
  }`,
  // Protocol drafts (De Charla a Protocolo)
  listProtocolDrafts: `query listProtocolDrafts($businessId: String!, $status: String) {
    listProtocolDrafts(businessId: $businessId, status: $status) {
      _id
      businessId
      protocolId
      version
      category
      title
      content { summary steps raw_markdown }
      retrieval_hints { semantic_intents tags }
      tools { tool_name required_params }
      metadata { priority author last_updated requires_human_handoff }
      status
      createdBy
      conversationId
      approvedAt
      createdAt
      updatedAt
    }
  }`,
  getProtocolDraft: `query getProtocolDraft($id: ID!) {
    getProtocolDraft(id: $id) {
      _id
      businessId
      protocolId
      version
      category
      title
      content { summary steps raw_markdown }
      retrieval_hints { semantic_intents tags }
      tools { tool_name required_params }
      metadata { priority author last_updated requires_human_handoff }
      status
      createdBy
      conversationId
      approvedAt
      createdAt
      updatedAt
    }
  }`,
  sendProtocolNarrative: `mutation sendProtocolNarrative($businessId: String!, $content: String!) {
    sendProtocolNarrative(businessId: $businessId, content: $content)
  }`,
  updateProtocolDraft: `mutation updateProtocolDraft($id: ID!, $input: UpdateProtocolDraftInput!) {
    updateProtocolDraft(id: $id, input: $input) {
      _id
      protocolId
      title
      status
      updatedAt
    }
  }`,
  approveProtocolDraft: `mutation approveProtocolDraft($id: ID!, $sourceId: String) {
    approveProtocolDraft(id: $id, sourceId: $sourceId) {
      _id
      status
      approvedAt
    }
  }`,
  rejectProtocolDraft: `mutation rejectProtocolDraft($id: ID!) {
    rejectProtocolDraft(id: $id) {
      _id
      status
    }
  }`,
  listKnowledgeDrafts: `query listKnowledgeDrafts($businessId: String!, $sourceId: String!, $status: String) {
    listKnowledgeDrafts(businessId: $businessId, sourceId: $sourceId, status: $status) {
      _id
      businessId
      sourceId
      draftId
      status
      payload
      createdBy
      conversationId
      approvedAt
      createdAt
      updatedAt
    }
  }`,
  sendKnowledgeNarrative: `mutation sendKnowledgeNarrative($businessId: String!, $sourceId: String!, $content: String!) {
    sendKnowledgeNarrative(businessId: $businessId, sourceId: $sourceId, content: $content)
  }`,
  approveKnowledgeDraft: `mutation approveKnowledgeDraft($id: ID!, $sourceId: String!) {
    approveKnowledgeDraft(id: $id, sourceId: $sourceId) {
      _id
      status
      approvedAt
    }
  }`,
  rejectKnowledgeDraft: `mutation rejectKnowledgeDraft($id: ID!, $sourceId: String!) {
    rejectKnowledgeDraft(id: $id, sourceId: $sourceId) {
      _id
      status
    }
  }`,
  updateKnowledgeDraft: `mutation updateKnowledgeDraft($id: ID!, $sourceId: String!, $payload: String!) {
    updateKnowledgeDraft(id: $id, sourceId: $sourceId, payload: $payload) {
      _id
      status
      updatedAt
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
      srcOrigins
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
      srcOrigins
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
        srcOrigins
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
        srcOrigins
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
      srcOrigins
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
      srcOrigins
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
  getTicketSettings: `query getTicketSettings {
    getTicketSettings {
      _id
      issues
      failures
      createdAt
      updatedAt
    }
  }`,
  createTicketSetting: `mutation createTicketSetting($args: TicketSettingInput!) {
    createTicketSetting(args: $args) {
      _id
      issues
      failures
      createdAt
      updatedAt
    }
  }`,
  updateTicketSetting: `mutation updateTicketSetting($id: ID!, $args: TicketSettingInput!) {
    updateTicketSetting(id: $id, args: $args) {
      _id
      issues
      failures
      createdAt
      updatedAt
    }
  }`,
  getTicket: `query getTicket($_id: ID!) {
    getTicket(_id: $_id) {
      _id
      number
      subject
      failureReason
      startDate
      endDate
      createdAt
      createdBy_id
      createdBy {
        _id
        name
        email
        photoURL
      }
      finishedBy_id
      finishedBy {
        _id
        name
        email
        photoURL
      }
      status
      priority
      technician_id
      technician {
        _id
        name
        email
        photoURL
      }
      department
      reportOrigin
      description
      ticketFileAttachment
      service {
        serviceId
        ip
        comments
        installationDate
        internetPlan {
          id
          name
        }
        zone {
          id
          name
        }
        router {
          id
          name
        }
        sectorial {
          id
          name
        }
      }
      responses {
        response
        createdAt
        author {
          id
          name
        }
        files
      }
      updatedAt
      changes {
        changedAt
        changedBy_id
        changedBy {
          _id
          name
          email
          photoURL
        }
        fields {
          field
          oldValue
          newValue
        }
      }
    }
  }`,
  getWisphubClientes: `query getWisphubClientes($searchText: String, $searchParam: String) {
    getWisphubClientes(searchText: $searchText, searchParam: $searchParam)
  }`,
  getWisphubZonas: `query getWisphubZonas {
    getWisphubZonas
  }`,
  getTickets: `query getTickets($sort: sortCriteriaTickets, $skip: Int, $limit: Int) {
    getTickets(sort: $sort, skip: $skip, limit: $limit) {
      total
      results {
        _id
        number
        subject
        failureReason
        startDate
        endDate
        createdAt
        createdBy_id
        createdBy {
          _id
          name
          email
          photoURL
          phone
        }
        finishedBy_id
        finishedBy {
          _id
          name
          email
          photoURL
          phone
        }
        status
        priority
        technician_id
        technician {
          _id
          name
          email
          photoURL
          phone
        }
        department
        reportOrigin
        description
        ticketFileAttachment
        service {
          serviceId
          ip
          comments
          installationDate
          internetPlan {
            id
            name
          }
          zone {
            id
            name
          }
          router {
            id
            name
          }
          sectorial {
            id
            name
          }
        }
        responses {
          response
          createdAt
          author {
            id
            name
          }
          files
        }
        updatedAt
        cliente {
          cliente
          usuario
          ip
          id_servicio
          coordenadas
          zona {
            id
            nombre
          }
        }
        changes {
          changedAt
          changedBy_id
          changedBy {
            _id
            name
            email
            photoURL
          }
          fields {
            field
            oldValue
            newValue
          }
        }
        usedSupplies {
          _id
        }
      }
    }
  }`,
  createTicket: `mutation createTicket($args: TicketInput!) {
    createTicket(args: $args) {
      _id
      number
      subject
      failureReason
      startDate
      endDate
      createdAt
      createdBy_id
      createdBy {
        _id
        name
        email
        photoURL
      }
      finishedBy_id
      finishedBy {
        _id
        name
        email
        photoURL
      }
      status
      priority
      technician_id
      technician {
        _id
        name
        email
        photoURL
      }
      department
      reportOrigin
      description
      ticketFileAttachment
      updatedAt
    }
  }`,
  updateTicket: `mutation updateTicket($id: ID!, $args: TicketInput!) {
    updateTicket(id: $id, args: $args) {
      _id
      number
      subject
      failureReason
      startDate
      endDate
      createdAt
      createdBy_id
      createdBy {
        _id
        name
        email
        photoURL
      }
      finishedBy_id
      finishedBy {
        _id
        name
        email
        photoURL
      }
      status
      priority
      technician_id
      technician {
        _id
        name
        email
        photoURL
      }
      department
      reportOrigin
      description
      ticketFileAttachment
      updatedAt
      usedSupplies {
        _id
      }
    }
  }`,
  createUsedSupply: `mutation createUsedSupply($args: UsedSupplyInput!) {
    createUsedSupply(args: $args) {
      _id
    }
  }`,
  deleteTicket: `mutation deleteTicket($id: ID!) {
    deleteTicket(id: $id)
  }`,
  // Queries de Storage (api-jaihom)
  fileUploadApiJaihom: `mutation($file:Upload!, $args:String) {
    fileUpload(file:$file, args:$args){
      _id
      lote
      path
      createdAt
    }
  }`,
  getUploadFilesApiJaihom: `query($skip: Int, $limit: Int) {
    getUploadFiles(skip:$skip, limit:$limit){
      total
      results{
        _id
        lote
        path
        createdAt
      }
    }
  }`,
  // Queries de Storage (4net-erp-backend)
  uploadFile: `mutation($file: Upload!, $args: StorageInput) {
    uploadFile(file: $file, args: $args) {
      _id
      filename
      originalName
      mimeType
      size
      path
      url
      uploadedBy
      category
      description
      tags
      createdAt
      updatedAt
    }
  }`,
  getStorage: `query($_id: ID!) {
    getStorage(_id: $_id) {
      _id
      filename
      originalName
      mimeType
      size
      path
      url
      uploadedBy
      category
      description
      tags
      createdAt
      updatedAt
    }
  }`,
  getStorages: `query($skip: Int, $limit: Int, $sort: sortCriteriaStorage, $filter: filterCriteriaStorage) {
    getStorages(skip: $skip, limit: $limit, sort: $sort, filter: $filter) {
      total
      results {
        _id
        filename
        originalName
        mimeType
        size
        path
        url
        uploadedBy
        category
        description
        tags
        createdAt
        updatedAt
      }
    }
  }`,
  updateStorage: `mutation($_id: ID!, $args: StorageUpdateInput!) {
    updateStorage(_id: $_id, args: $args) {
      _id
      filename
      originalName
      mimeType
      size
      path
      url
      uploadedBy
      category
      description
      tags
      createdAt
      updatedAt
    }
  }`,
  deleteStorage: `mutation($_id: ID!) {
    deleteStorage(_id: $_id)
  }`,
}