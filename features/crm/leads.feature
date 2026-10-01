@crm @leads
Feature: Lead Management
  As a sales user
  I want to manage leads in Dynamics CRM
  So that I can track and convert prospective customers

  Background:
    Given I am logged into CRM

  @smoke @create
  Scenario: Successfully create a lead with required fields
    Given I navigate to the Leads list
    When I click New
    And I fill in the lead last name with a unique test value
    And I fill in the company name with a unique test value
    And I click Save
    Then the lead should be saved successfully
    And I should see the lead in the Leads grid

  @regression @create
  Scenario: Create a lead with all fields
    Given I navigate to the Leads list
    When I click New
    And I fill in the lead first name with a unique test value
    And I fill in the lead last name with a unique test value
    And I fill in the company name with a unique test value
    And I fill in the email with a unique test email
    And I fill in the phone with a unique test phone
    And I click Save
    Then the lead should be saved successfully

  @regression @validation
  Scenario: Lead requires Last Name and Company Name
    Given I navigate to the Leads list
    When I click New
    And I click Save without filling any fields
    Then I should see a required field validation error for Last Name
    And I should see a required field validation error for Company Name

  @regression @qualify
  Scenario: Qualify a lead to create Contact, Account, and Opportunity
    Given a lead with a unique last name exists in CRM
    When I open the lead record
    And I click Qualify
    Then the lead should be marked as Qualified
    And a Contact should be created from the lead
    And an Account should be created from the lead
    And an Opportunity should be created from the lead

  @regression @disqualify
  Scenario: Disqualify a lead with a reason
    Given a lead with a unique last name exists in CRM
    When I open the lead record
    And I click Disqualify with reason "Cannot Contact"
    Then the lead should be marked as Disqualified

  @regression @search
  Scenario: Search for an existing lead by name
    Given a lead with a unique last name exists in CRM
    When I navigate to the Leads list
    And I search for the lead by last name
    Then the lead should appear in the search results
