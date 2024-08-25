// Importing React
import React, { useEffect, useState } from 'react';
// Importing necessary components and functions from the HubSpot UI extensions library
import {
    hubspot,
    Heading,
    Divider,
    Flex,
    Select,
    Input,
    Text,
    Button,
    TextArea,
    NumberInput,
    ToggleGroup,
    MultiSelect,
    DateInput,
} from '@hubspot/ui-extensions';
// Import fields json file as `fields`
import fields from './fields.json';

// Register the extension with HubSpot using the 'crm.record.tab' context
// This tells HubSpot where the extension will be displayed/used.
hubspot.extend<'crm.record.tab'>(({ actions, runServerlessFunction }) => (
    <Extension actions={actions} runServerlessFunction={runServerlessFunction} />
));

/**
 * Main extension component
 * @param {Object} props - Component properties
 * @param {Object} props.actions - HubSpot actions passed to the extension
 * @param {Function} props.runServerlessFunction - Function to run serverless functions
 */
const Extension = ({ actions, runServerlessFunction }) => {
    // Get refreshObjectProperties from actions
    const { refreshObjectProperties } = actions;
    // State to store property data fetched from the server
    const [propertyData, setPropertyData] = useState([]);
    // State to store the current values of properties
    const [currentValue, setCurrentValue] = useState({});
    // State to store the new values entered by the user
    const [newValues, setNewValues] = useState({});


    // Fetch property details when the component mounts
    useEffect(() => {
        Promise.all(
            fields.fields.map(field =>
                runServerlessFunction({
                    // Serverless function to get a property value
                    name: 'getProperty',
                    parameters: {
                        objectType: 'companies',
                        propertyName: field.id
                    }
                })
            )
        ).then(responses => {
            // Log the responses from the server
            const propertyDetails = responses.reduce((acc, response) => {
                if (response.status === 'SUCCESS') {
                    // Add successful responses to the accumulator
                    acc.push(response.response);
                } else {
                    // Log any errors encountered
                    console.error('Error:', response);
                }
                return acc;
            }, []);
            // Log the aggregated property details
            console.log('Property Details:', propertyDetails);
            // Update the state with the fetched property data
            setPropertyData(propertyDetails);
        }).catch(error => {
            // Catch and log any errors during fetch
            console.error('Error fetching property details:', error);
        });
        // Fetch current property values
        runServerlessFunction({
            name: 'getCurrentValues',
            parameters: {
                propertyName: fields.fields.map(field => field.id)
            },
            // Send object ID with the request
            propertiesToSend: ['hs_object_id']
        }).then(response => {
            if (response.status === 'SUCCESS') {
                console.log('Property Values:', response.response.properties);
                setCurrentValue(response.response.properties); // Adjust based on actual response structure
            } else {
                console.error('Error fetching current values:', response);
            }
        }).catch(error => {
            console.error('Error fetching current values:', error);
        });
    // Dependency array includes runServerlessFunction to avoid unnecessary re-renders
    }, [runServerlessFunction]);

    // Handle changes to input values for string and enumeration fields
    const handleValueChange = (propertyId, value) => {
        console.log({
            event: "handleValueChange",
            propertyId,
            value
        });
        // Update the state with the new value
        setNewValues(prev => ({ ...prev, [propertyId]: value }));
    };

    // Function to update property values in HubSpot
    const handleUpdateProperty = () => {
        const updates = propertyData.map(property => ({
            propertyName: property.name, // Property name to update
            newValue: newValues[property.name] || currentValue[property.name] // New value or the current value if unchanged
        }));
        console.log({
            updates,
            newValues,
            currentValue,
        })
        // Call serverless function for each property update
        Promise.all(updates.map(update =>
            runServerlessFunction({
                // Specify serverless function
                name: 'updateProperty',
                parameters: update,
                // Send object ID with the request
                propertiesToSend: ['hs_object_id']
            })
        )).then(() => {
            // Refresh properties after successful update
            refreshObjectProperties();
        }).catch(error => {
            // Catch and log errors during update
            console.error('Error updating properties:', error);
        });
    };

    // Render input fields based on property type
    const renderInputField = (property) => {
        console.log({
            event: 'Rendering property:',
            newValues,
            // currentValue,
            property_type: property.type,
            field_type: property.fieldType,
            currentValue: currentValue[property.name]
        });
        switch (property.fieldType) {
            case 'text':
                return (
                    <Input
                        key={property.name}
                        name={property.name}
                        type="text"
                        label={property.label}
                        value={newValues[property.name] || currentValue[property.name] || ''}
                        onChange={(e) => handleValueChange(property.name, e)}
                        placeholder={`Enter new value for ${property.label}`}
                    />
                );
            case 'select':
                return (
                    <Select
                        key={property.name}
                        name={property.name}
                        value={newValues[property.name] || currentValue[property.name] || ''}
                        onChange={(e) => handleValueChange(property.name, e)}
                        options={property.options || []}
                        label={property.label}
                        placeholder={`Select a value for ${property.label}`}
                    />
                );
            case 'checkbox':
                let computed = newValues[property.name] || (currentValue[property.name] || null)
                if (!!computed && computed.length > 0) {
                    console.warn({computed})
                    if (!Array.isArray(computed)) {
                        computed = computed.split(";")
                    }
                } else {
                    computed = []
                }
                return (
                    <MultiSelect
                        key={property.name}
                        name={property.name}
                        label={property.label}
                        options={property.options || []}
                        value={computed}
                        onChange={(e) => handleValueChange(property.name, e)}
                    />
                );
            case "date":
                let date = new Date()
                if (!!newValues[property.name]) {
                    let [year, month, day] = newValues[property.name].formattedDate.split('-').map(Number);
                    date = new Date(year, month - 1, day); // Month is 0-based, so subtract 1
                } else if (!!currentValue[property.name]) {
                    let [year, month, day] = currentValue[property.name].split('-').map(Number);
                    date = new Date(year, month - 1, day); // Month is 0-based, so subtract 1
                }
                return (
                    <DateInput
                        key={property.name}
                        name={property.name}
                        label={property.label}
                        value={{
                            year: date.getFullYear(),
                            month: date.getMonth(),
                            date: date.getDate()
                        }}
                        format="standard"
                        onChange={(e) => handleValueChange(property.name, e)}
                    />
                )
            case 'textarea':
                return (
                    <TextArea
                        key={property.name}
                        name={property.name}
                        value={newValues[property.name] || currentValue[property.name] || ''}
                        onChange={(e) => handleValueChange(property.name, e)}
                        label={property.label}
                        placeholder={`Select a value for ${property.label}`}
                        resize='vertical'
                    />
                );
            case 'number':
                return (
                    <NumberInput
                        key={property.name}
                        name={property.name}
                        label={property.label}
                        value={newValues[property.name] || currentValue[property.name] || ''}
                        onChange={(e) => handleValueChange(property.name, e)}
                        placeholder={`Enter new value for ${property.label}`}
                    />
                );
            case "booleancheckbox":
                return (
                    <ToggleGroup
                        key={property.name}
                        name={property.name}
                        label={property.label}
                        options={property.options || []}
                        toggleType='radioButtonList'
                        inline={true}
                        value={newValues[property.name] || currentValue[property.name] || ''}
                        onChange={(e) => handleValueChange(property.name, e)}
                    />
                );
            default:
                console.error("Unsupported fieldType: ", property.fieldType)
                // Return null for unsupported property types
                return null;
        }
    };

    return (
        <Flex direction="column" gap="sm">
            {propertyData.length > 0 ? (
                propertyData.map(property => (
                    renderInputField(property)
                )) // Render input fields for each property
            ) : (
                <Text>No properties to display</Text> // Display message if no properties are available
            )}
            <Button onClick={handleUpdateProperty}>{fields.button_text}</Button>
        </Flex>
    );
};
