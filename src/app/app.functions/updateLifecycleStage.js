// for HubSpot API calls
const hubspot = require('@hubspot/api-client');

exports.main = async (context = {}) => {
  const hubspotClient = new hubspot.Client({
    accessToken: process.env['PRIVATE_APP_ACCESS_TOKEN']
  });

  // Extract the value to update and the company ID
  const { stage } = context.parameters;
  const { hs_object_id } = context.propertiesToSend;
  console.log("-------------------------------------")
  console.log('New Value:', stage);
  console.log('Company ID (hs_object_id):', hs_object_id);
  console.log("-------------------------------------")

  // Set lifecyclestage to empty string to clear the property
  await hubspotClient.crm.companies.basicApi.update(
    hs_object_id,
    {
      properties: { lifecyclestage: "" }
    }
  );

  const apiResponse = await hubspotClient.crm.companies.basicApi.update(
    hs_object_id,
    {
      properties: { lifecyclestage: stage }
    }
  );

  return apiResponse;
};