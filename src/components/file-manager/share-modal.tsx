import React from "react";
import styled, { ThemeProvider } from "styled-components";
import Modal, { ModalProvider } from "styled-react-modal";

import { FRONT_END_URL, MOBILE_WIDTH, theme } from "../../config";

import ClipboardWidget from "../shared/clipboard-widget";

const Body = styled.div`
  display: flex;
  justify-content: center;
  flex-direction: column;
  @media (max-width: ${MOBILE_WIDTH}px) {
    width: 290px;
  }
`;

const StyledModal = Modal.styled`
  background-color: white;
  padding: 20px;
`;

const Title = styled.h2`
  font-size: 20px;
  color: ${props => props.theme.title.color};
`;

const Filename = styled.h3`
  font-size: 20px;
  font-weight: 500;
  margin-top: 0px;
`;

const ShareModal = ({ close, isOpen, file }) => (
  <ThemeProvider theme={theme}>
    <ModalProvider>
      <StyledModal
        isOpen={isOpen}
        onBackgroundClick={() => close()}
        onEscapeKeydown={() => close()}
      >
        <Body>
          <Title>Share your file with others</Title>
          <Filename>{file && file.filename}</Filename>
          <ClipboardWidget
            text={`${FRONT_END_URL}/share?handle=${file && file.handle}`}
            property="URL"
            title="Anyone with this link can view the file"
          />
        </Body>
      </StyledModal>
    </ModalProvider>
  </ThemeProvider>
);

export default ShareModal;