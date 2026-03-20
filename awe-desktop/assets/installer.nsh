!include "MUI2.nsh"

; Custom installer pages and settings
Name "AWE Desktop"

; Request application privileges
RequestExecutionLevel user

; Show installation details
ShowInstDetails show

; Custom finish page
!define MUI_FINISHPAGE_RUN "$INSTDIR\AWE Desktop.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Launch AWE Desktop"

; Welcome page text
!define MUI_WELCOMEPAGE_TEXT "This will install AWE Desktop - Automated Writing Evaluation System on your computer.$\r$\n$\r$\nDeveloped by Dr. Waleed Mandour, Sultan Qaboos University.$\r$\n$\r$\nClick Next to continue."
