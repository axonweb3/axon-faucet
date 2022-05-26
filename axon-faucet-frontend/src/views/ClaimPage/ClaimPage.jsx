import "./ClaimPage.scss";

import React, { useContext, useState, useEffect } from "react";

import PropTypes from "prop-types";

import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import Row from "react-bootstrap/Row";

import { RequesterContext } from "../../utils";

function getAbbreviation(str, begin, end) {
  return `${str.substring(0, begin)}...${str.substring(str.length - end, str.length)}`;
}

function getDateString(date) {
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
}

function formatValue(value, digits = 2, decimal = 18) {
  const left = `${Math.floor(value / (10 ** decimal))}`;

  if (digits > 0) {
    const right = `${Math.floor((value % (10 ** digits)) / (10 ** (decimal - digits)))}`
      .padStart(digits, "0");
    return `${left}.${right}`;
  }

  return left;
}

function TransactionCard(props) {
  const {
    to,
    hash,
    time,
    value,
    status,
  } = props;
  const date = new Date(time);

  let badge;
  if (status === "Confirmed") {
    badge = <Badge bg="success">{status}</Badge>;
  } else if (status === "Failed") {
    badge = <Badge bg="danger">{status}</Badge>;
  } else {
    badge = <Badge bg="secondary">{status}</Badge>;
  }

  const valueText = `${formatValue(value)} Token(s)`;

  return (
    <Row className="bg-primary my-3 p-3 text-white rounded">
      <Col>
        <Row>
          <Col>
            {getAbbreviation(hash, 22, 20)}
          </Col>
          <Col xs="12" md="auto" className="mt-1 mt-md-0">
            {getDateString(date)}
          </Col>
        </Row>
        <hr className="mt-2" />
        <Row className="mt-4 mb-3 fs-5">
          <Col>
            To:&nbsp;
            <span className="d-md-none">{getAbbreviation(to, 12, 10)}</span>
            <span className="d-none d-md-inline">{to}</span>
          </Col>
          <Col xs="auto" className="d-none d-sm-block">{valueText}</Col>
        </Row>
        <Row className="mt-4 mb-3 fs-5">
          <Col>{badge}</Col>
          <Col xs="auto" className="d-sm-none">{valueText}</Col>
        </Row>
      </Col>
    </Row>
  );
}

TransactionCard.propTypes = {
  to: PropTypes.string.isRequired,
  hash: PropTypes.string.isRequired,
  time: PropTypes.number.isRequired,
  value: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired,
};

export default function ClaimPage() {
  const requester = useContext(RequesterContext);
  const [claimAccount, setClaimAccount] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);

  useEffect(() => {
    requester.get("/transactions")
      .then(({ data }) => setTransactions(data));
    requester.get("/totalBalance")
      .then(({ data }) => setTotalBalance(data));
  }, [requester]);

  const noTransactionTip = transactions.length !== 0
    ? null
    : (
      <Row className="flex-grow-1 justify-content-center align-items-center">
        <Col xs="auto" className="fs-4 text-muted">
          There is no transaction yet
        </Col>
      </Row>
    );

  return (
    <>
      <div className="text-white ClaimPage__Banner">
        <div style={{ background: "#1123C566" }}>
          <h1 className="fs-1 py-2 ps-4">Axon</h1>
        </div>
        <Container className="h-100">
          <Row className="flex-column h-100">
            <Col className="d-flex justify-content-center">
              <h1
                className="text-center fw-bold"
                style={{
                  margin: "6rem 0",
                  fontSize: "5rem",
                }}
              >
                Axon
                <br />
                Faucet
              </h1>
            </Col>
            <Col xs="auto" className="my-4">
              <Row className="justify-content-center">
                <Col xs="12" md="10" lg="8" xl="6">
                  <InputGroup>
                    <Form.Control
                      placeholder="Enter your Axon account address"
                      value={claimAccount}
                      onChange={(e) => setClaimAccount(e.target.value)}
                    />
                    <Button
                      className="text-white"
                      onClick={() => {
                        requester.post("/claim", { account: claimAccount });
                      }}
                    >
                      Claim
                    </Button>
                  </InputGroup>
                </Col>
              </Row>
            </Col>
            <Col xs="auto" className="my-4 py-4 text-center text-info">
              There are&nbsp;
              {formatValue(totalBalance)}
              &nbsp;token(s) left in Axon Faucet
            </Col>
          </Row>
        </Container>
      </div>
      <Container className="py-4 flex-grow-1 d-flex flex-column">
        <Row className="justify-content-center flex-grow-1">
          <Col xs="12" lg="9" className="d-flex flex-column">
            <Row>
              <Col>
                <h2 className="text-primary">Claims</h2>
              </Col>
            </Row>
            {
              transactions.map(({
                to,
                hash,
                time,
                value,
                status,
              }) => (
                <TransactionCard
                  to={to}
                  hash={hash}
                  time={time}
                  value={value}
                  status={status}
                  key={hash}
                />
              ))
            }
            {noTransactionTip}
          </Col>
        </Row>
      </Container>
      <div
        style={{ background: "#DACDDF" }}
        className="text-center text-info py-2"
      >
        Copyright © 2022 Cryptape. All Rights Reserved.
      </div>
    </>
  );
}
