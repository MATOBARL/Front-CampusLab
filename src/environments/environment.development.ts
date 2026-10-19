export const environment = {
  production: false,
  msalConfig: {
    auth: {
      clientId: '6bf386f7-c08e-4ab9-88cd-57f56b590e66',
      authority: 'https://login.microsoftonline.com/c75374e8-15d8-446b-8c6c-291120e0c761/'
    }
  },
  apiConfig: {
    scopes: ['api://6bf386f7-c08e-4ab9-88cd-57f56b590e66/access_as_user'],
    // En desarrollo local apunta directamente al servidor BFF en localhost:8080
    uri: 'http://localhost:8080/api'
  }
};