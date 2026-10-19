export const environment = {
  production: true,
  msalConfig: {
    auth: {
      clientId: '6bf386f7-c08e-4ab9-88cd-57f56b590e66',
      authority: 'https://login.microsoftonline.com/c75374e8-15d8-446b-8c6c-291120e0c761/'
      // redirectUri se calcula en runtime con window.location.origin
    }
  },
  apiConfig: {
    scopes: ['api://6bf386f7-c08e-4ab9-88cd-57f56b590e66/access_as_user'],
    // Nginx reenvía /api/* al BFF dentro de la red de docker compose
    uri: '/api'
  },
  apiUrl: 'http://localhost:8080/api' // URL fallback para desarrollo local fuera de Docker
};