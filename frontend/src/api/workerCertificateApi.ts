import { authenticatedRequest } from './authenticatedRequest'

const CERTIFICATE_PREFIX = '/api/certificate'

export const workerCertificateApi = {
  renderCertificateHtml: async (dateFrom?: string, dateTo?: string): Promise<string> => {
    const response = await authenticatedRequest<string>(
      {
        method: 'GET',
        url: `${CERTIFICATE_PREFIX}/render`,
        params: {
          date_from: dateFrom,
          date_to: dateTo,
        },
        responseType: 'text',
      },
      'Unable to generate certificate right now.',
    )

    return response.data
  },
}
