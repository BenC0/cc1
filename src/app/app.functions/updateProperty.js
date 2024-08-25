// Import the HubSpot API client
const hubspot = require('@hubspot/api-client');

// Initialize the HubSpot API client with your access token
const hubspotClient = new hubspot.Client({
  accessToken: process.env['PRIVATE_APP_ACCESS_TOKEN']
});

// Serverless function to update a property for a company
exports.main = async (context = {}) => {
  try {
    // Extract parameters from the context
    const { propertyName } = context.parameters;
    const { newValue } = context.parameters;
    const { hs_object_id } = context.propertiesToSend; // Company ID or object ID to update

    if (!!hs_object_id && !!propertyName && !!newValue) {

        let formattedValue = newValue;
        if (typeof formattedValue === 'object' && formattedValue.hasOwnProperty("formattedDate")) {
          // Parse the date
          const date = new Date(formattedValue.formattedDate);
          // Adjust for local timezone offset to ensure the date represents midnight UTC
          const localOffset = date.getTimezoneOffset() * 60000;
          const utcDate = new Date(date.getTime() - localOffset);
          // Set to midnight UTC
          utcDate.setUTCHours(0, 0, 0, 0);
          // Convert to Unix timestamp
          formattedValue = utcDate.getTime();

        } else if (Array.isArray(formattedValue)) {
          // Convert arrays to semicolon-separated strings
          formattedValue = formattedValue.join(';');
        }


        // Prepare the update payload
        let updatePayload = { properties: {} };
        updatePayload["properties"][propertyName] = formattedValue;

        // Update the property for the specified company
        const apiResponse = await hubspotClient.crm.companies.basicApi.update(
            hs_object_id,
            updatePayload,
        );

        // Return the response
        return apiResponse;
      
    } else if (!propertyName || !hs_object_id) {
        throw new Error('Required parameters are missing.');
    }
  } catch (error) {
    console.error('Error updating property:', error);
    throw error;
  }
};
