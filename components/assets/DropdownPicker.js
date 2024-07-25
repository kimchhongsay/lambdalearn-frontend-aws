import CheckBox from "@react-native-community/checkbox";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ModalDropdown from "react-native-modal-dropdown";
const DropdownPicker = ({
  options,
  onSelect,
  defaultValue,
  otherValue,
  setOtherValue,
}) => {
  const [selectedOptions, setSelectedOptions] = useState(defaultValue);

  const handleSelect = (index, value) => {
    const newSelectedOptions = [...selectedOptions];
    const optionIndex = newSelectedOptions.indexOf(value);

    if (optionIndex > -1) {
      // Remove the value if already selected
      newSelectedOptions.splice(optionIndex, 1);
    } else {
      // Add the value if not selected
      newSelectedOptions.push(value);
    }

    setSelectedOptions(newSelectedOptions);
    onSelect(newSelectedOptions);
  };

  const renderDropdownItem = (option, index) => {
    const isSelected = selectedOptions.includes(option.value);

    return (
      <TouchableOpacity
        key={index}
        style={styles.dropdownItem}
        onPress={() => handleSelect(index, option.value)}>
        <CheckBox
          value={isSelected}
          onValueChange={() => handleSelect(index, option.value)}
        />
        <Text style={styles.dropdownItemText}>{option.label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View>
      <ModalDropdown
        options={options}
        style={styles.dropdown}
        textStyle={styles.dropdownText}
        dropdownStyle={styles.dropdownDropdown}
        renderRow={renderDropdownItem}
        defaultValue={defaultValue}
      />
      {otherValue !== undefined && otherValue === "Other" && (
        <TextInput
          style={styles.textInput}
          placeholder="Enter subject"
          value={otherValue}
          onChangeText={(text) => setOtherValue(text)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  dropdown: {
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 5,
  },
  dropdownText: {
    fontSize: 20,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  dropdownItemText: {
    fontSize: 16,
    marginLeft: 10,
  },
  dropdownDropdown: {
    width: "100%",
    padding: 16,
  },
  textInput: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginTop: 10,
    paddingLeft: 10,
    borderRadius: 5,
  },
});

export default DropdownPicker;
