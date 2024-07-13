import React from "react";
import { StyleSheet, TextInput, View } from "react-native";
import ModalDropdown from "react-native-modal-dropdown";

const DropdownPicker = ({
  options,
  onSelect,
  defaultValue,
  otherValue,
  setOtherValue,
}) => {
  const handleSelect = (index, value) => {
    onSelect(value);
  };

  return (
    <View>
      <ModalDropdown
        options={options}
        onSelect={handleSelect}
        style={styles.dropdown}
        textStyle={styles.dropdownText}
        dropdownStyle={styles.dropdownDropdown}
        dropdownTextStyle={styles.dropdownItemText}
        defaultIndex={0}
        defaultValue={defaultValue}
      />
      {otherValue !== undefined && otherValue === "Other" && (
        <TextInput
          style={styles.textInput}
          placeholder="Enter subject"
          value={setOtherValue}
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
  },
  dropdownText: {
    fontSize: 20,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  dropdownItemText: {
    fontSize: 16,
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
