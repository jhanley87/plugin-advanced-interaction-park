import React, { useState } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker as MuiDateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import TextField from "@mui/material/TextField";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import * as Flex from "@twilio/flex-ui";

interface DateTimePickerWrapperProps {
  value: any;
  onchange: (value: any, keyboardInputValue?: string | undefined) => void;
}

export const DateTimePickerWrapper = (props: DateTimePickerWrapperProps) => {
  return (
    <>
      <ThemeProvider
        theme={createTheme({
          palette: {
            mode: Flex.Manager.getInstance().configuration.theme?.isLight
              ? "light"
              : "dark",
          },
        })}
      >
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <MuiDateTimePicker
          
            value={props.value}
            onChange={props.onchange}
            renderInput={(params) => (
              <TextField
              
                id="unparkAt"
                placeholder="mm/dd/yyyy hh:mm"
                size="small"
                fullWidth
                {...params}
              />
            )}
            disablePast
          />
        </LocalizationProvider>
      </ThemeProvider>
    </>
  );
};
